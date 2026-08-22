import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Wallet, Pickaxe, Lock, Flame, ArrowLeftRight, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";

const TOKENS = ["SKY444", "DODGE", "TRUMP", "BTC", "USDT", "MONERO"] as const;
type Token = typeof TOKENS[number];

const TOKEN_META: Record<Token, { name: string; color: string; emoji: string }> = {
  SKY444: { name: "SkyCoin 444", color: "from-cyan-500 to-blue-600", emoji: "🌌" },
  DODGE: { name: "Dodge", color: "from-yellow-400 to-amber-500", emoji: "🐕" },
  TRUMP: { name: "Trump Coin", color: "from-red-500 to-rose-600", emoji: "🦅" },
  BTC: { name: "Bitcoin", color: "from-orange-400 to-orange-600", emoji: "₿" },
  USDT: { name: "Tether", color: "from-green-400 to-emerald-600", emoji: "💵" },
  MONERO: { name: "Monero", color: "from-orange-500 to-zinc-600", emoji: "🔒" },
};

export default function Crypto() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const [mineToken, setMineToken] = useState<Token>("TRUMP");
  const [hashRate, setHashRate] = useState("100");
  // Staking state
  const [stakeToken, setStakeToken] = useState<Token>("SKY444");
  const [stakeAmount, setStakeAmount] = useState("");
  const [lockDays, setLockDays] = useState("30");
  // Burn state
  const [burnToken, setBurnToken] = useState<Token>("DODGE");
  const [burnAmount, setBurnAmount] = useState("");
  // Swap state
  const [fromToken, setFromToken] = useState<Token>("SKY444");
  const [toToken, setToToken] = useState<Token>("BTC");
  const [swapAmount, setSwapAmount] = useState("");

  const portfolio = trpc.crypto.getPortfolio.useQuery(undefined, { enabled: isAuthenticated });
  const prices = trpc.crypto.getPrices.useQuery(undefined, { enabled: isAuthenticated });
  const miningOps = trpc.crypto.getMiningOperations.useQuery(undefined, { enabled: isAuthenticated });
  const stakingPositions = trpc.crypto.getStakingPositions.useQuery(undefined, { enabled: isAuthenticated });
  const txHistory = trpc.crypto.getTransactionHistory.useQuery({ limit: 20 }, { enabled: isAuthenticated });

  const refetchAll = () => {
    utils.crypto.getPortfolio.invalidate();
    utils.crypto.getMiningOperations.invalidate();
    utils.crypto.getStakingPositions.invalidate();
    utils.crypto.getTransactionHistory.invalidate();
  };

  const initWallet = trpc.crypto.initializeWallet.useMutation();
  const startMining = trpc.crypto.startMining.useMutation();
  const completeMining = trpc.crypto.completeMining.useMutation();
  const startStaking = trpc.crypto.startStaking.useMutation();
  const unstake = trpc.crypto.unstake.useMutation();
  const burnTokens = trpc.crypto.burnTokens.useMutation();
  const swap = trpc.crypto.swap.useMutation();

  // Auth gate
  if (authLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Spinner />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <Wallet className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
        <h1 className="text-2xl font-bold mb-2">Crypto Wallet</h1>
        <p className="text-muted-foreground mb-6">Sign in to access mining, staking, burning, and swapping.</p>
        <a href={getLoginUrl()}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">Sign In</Button>
        </a>
      </div>
    );
  }

  const getPrice = (token: Token) => prices.data?.find((p: any) => p.token === token);

  const handleMine = async () => {
    const res = await startMining.mutateAsync({ token: mineToken, hashRate: Number(hashRate) });
    if (res.unavailable) {
      toast.error(res.error || "Mining is unavailable");
      return;
    }

    if (res.success && typeof res.operationId === "number") {
      toast.success("Mining operation started");
      return;
    }

    toast.error(res.error || "Mining failed");
  };

  const handleStake = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return toast.error("Enter a valid amount");
    const res = await startStaking.mutateAsync({ token: stakeToken, amount: Number(stakeAmount), lockPeriodDays: Number(lockDays) });
    if (res.success) {
      toast.success(`Staked ${stakeAmount} ${stakeToken} at ${res.apy?.toFixed(1)}% APY`);
      setStakeAmount("");
      refetchAll();
    } else {
      toast.error(res.error || "Staking failed");
    }
  };

  const handleUnstake = async (positionId: number) => {
    const res = await unstake.mutateAsync({ positionId });
    if (res.success) {
      toast.success(`Unstaked! +${res.rewards?.toFixed(4)} rewards`);
      refetchAll();
    } else {
      toast.error(res.error || "Unstake failed");
    }
  };

  const handleBurn = async () => {
    if (!burnAmount || Number(burnAmount) <= 0) return toast.error("Enter a valid amount");
    const res = await burnTokens.mutateAsync({ token: burnToken, amount: Number(burnAmount), reason: "manual" });
    if (res.success) {
      toast.success(`Burned ${burnAmount} ${burnToken} 🔥`);
      setBurnAmount("");
      refetchAll();
    } else {
      toast.error(res.error || "Burn failed");
    }
  };

  const handleSwap = async () => {
    if (!swapAmount || Number(swapAmount) <= 0) return toast.error("Enter a valid amount");
    if (fromToken === toToken) return toast.error("Choose different tokens");
    const res = await swap.mutateAsync({ fromToken, toToken, fromAmount: Number(swapAmount) });
    if (res.success) {
      toast.success(`Swapped ${swapAmount} ${fromToken} → ${res.toAmount?.toFixed(4)} ${toToken}`);
      setSwapAmount("");
      refetchAll();
    } else {
      toast.error(res.error || "Swap failed");
    }
  };

  const ensureWallet = async (token: Token, initial = 1000) => {
    await initWallet.mutateAsync({ token, initialBalance: initial });
    toast.success(`${token} wallet created with ${initial} starter balance`);
    refetchAll();
  };

  return (
    <div className="container py-8 max-w-6xl">
      {/* Wallet Connection */}
      <div className="mb-6">
        <WalletConnect />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Wallet className="w-8 h-8 text-cyan-400" />
            Crypto Hub
          </h1>
          <p className="text-muted-foreground mt-1">Mine, stake, burn, and swap across 6 tokens</p>
        </div>
        <Card className="px-6 py-3">
          <div className="text-sm text-muted-foreground">Portfolio Value</div>
          <div className="text-2xl font-extrabold text-cyan-400">
            ${portfolio.data?.totalValueUsd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "0.00"}
          </div>
        </Card>
      </div>

      {/* Live Prices */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {TOKENS.map((token) => {
          const p = getPrice(token);
          const meta = TOKEN_META[token];
          const up = (p?.priceChange24h || 0) >= 0;
          return (
            <Card key={token} className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{meta.emoji}</span>
                <span className="font-bold text-sm">{token}</span>
              </div>
              <div className="text-lg font-extrabold">${p?.priceUsd?.toLocaleString() || "—"}</div>
              <div className={`text-xs flex items-center gap-1 ${up ? "text-green-400" : "text-red-400"}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {up ? "+" : ""}{p?.priceChange24h?.toFixed(2) || "0"}%
              </div>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6 w-full overflow-x-auto">
          <TabsTrigger value="portfolio" className="text-xs md:text-sm"><Coins className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Portfolio</span></TabsTrigger>
          <TabsTrigger value="mine" className="text-xs md:text-sm"><Pickaxe className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Mine</span></TabsTrigger>
          <TabsTrigger value="stake" className="text-xs md:text-sm"><Lock className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Stake</span></TabsTrigger>
          <TabsTrigger value="burn" className="text-xs md:text-sm"><Flame className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Burn</span></TabsTrigger>
          <TabsTrigger value="swap" className="text-xs md:text-sm"><ArrowLeftRight className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Swap</span></TabsTrigger>
        </TabsList>

        {/* PORTFOLIO */}
        <TabsContent value="portfolio" className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {TOKENS.map((token) => {
              const w = portfolio.data?.wallets?.find((x: any) => x.token === token);
              const meta = TOKEN_META[token];
              return (
                <Card key={token} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-lg`}>
                        {meta.emoji}
                      </div>
                      <div>
                        <div className="font-bold">{token}</div>
                        <div className="text-xs text-muted-foreground">{meta.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {w ? (
                        <>
                          <div className="font-extrabold">{w.balance?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                          <div className="text-xs text-muted-foreground">${w.valueUsd?.toFixed(2) || "0.00"}</div>
                          {w.stakedBalance > 0 && (
                            <div className="text-xs text-purple-400">{w.stakedBalance.toFixed(2)} staked</div>
                          )}
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => ensureWallet(token)} disabled={initWallet.isPending}>
                          Create Wallet
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Transaction History */}
          <Card className="p-4">
            <h3 className="font-bold mb-3">Recent Transactions</h3>
            {txHistory.data && txHistory.data.length > 0 ? (
              <div className="space-y-2">
                {txHistory.data.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{tx.type}</Badge>
                      <span className="text-muted-foreground">{tx.description}</span>
                    </div>
                    <span className="font-semibold">{tx.amount?.toFixed(4)} {tx.token}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transactions yet. Start mining or swapping!</p>
            )}
          </Card>
        </TabsContent>

        {/* MINING */}
        <TabsContent value="mine">
          <Card className="p-6 max-w-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Pickaxe className="w-5 h-5 text-cyan-400" /> Mine Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Token to mine</label>
                <Select value={mineToken} onValueChange={(v) => setMineToken(v as Token)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOKENS.filter((t) => t !== "USDT").map((t) => (
                      <SelectItem key={t} value={t}>{TOKEN_META[t].emoji} {t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">USDT is a stablecoin and cannot be mined.</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Hash Rate (H/s)</label>
                <Input type="number" value={hashRate} onChange={(e) => setHashRate(e.target.value)} />
              </div>
              <Button onClick={handleMine} disabled={startMining.isPending || completeMining.isPending} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
                {startMining.isPending || completeMining.isPending ? <Spinner /> : <><Pickaxe className="w-4 h-4 mr-2" /> Start Mining</>}
              </Button>
            </div>
          </Card>

          <Card className="p-4 mt-4 max-w-xl">
            <h3 className="font-bold mb-3">Mining History</h3>
            {miningOps.data && miningOps.data.length > 0 ? (
              <div className="space-y-2">
                {miningOps.data.slice(0, 10).map((op: any) => (
                  <div key={op.id} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                    <span>{TOKEN_META[op.token as Token]?.emoji} {op.token}</span>
                    <Badge variant={op.status === "completed" ? "default" : "secondary"}>{op.status}</Badge>
                    <span className="font-semibold text-green-400">+{op.rewardAmount?.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No mining operations yet.</p>
            )}
          </Card>
        </TabsContent>

        {/* STAKING */}
        <TabsContent value="stake">
          <Card className="p-6 max-w-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-purple-400" /> Stake Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Token</label>
                <Select value={stakeToken} onValueChange={(v) => setStakeToken(v as Token)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOKENS.map((t) => <SelectItem key={t} value={t}>{TOKEN_META[t].emoji} {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Amount</label>
                <Input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Lock Period</label>
                <Select value={lockDays} onValueChange={setLockDays}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days (~5.3% APY)</SelectItem>
                    <SelectItem value="30">30 days (~6.2% APY)</SelectItem>
                    <SelectItem value="90">90 days (~8.7% APY)</SelectItem>
                    <SelectItem value="180">180 days (~12.4% APY)</SelectItem>
                    <SelectItem value="365">365 days (~20% APY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStake} disabled={startStaking.isPending} className="w-full bg-gradient-to-r from-purple-500 to-pink-600">
                {startStaking.isPending ? <Spinner /> : <><Lock className="w-4 h-4 mr-2" /> Stake Now</>}
              </Button>
            </div>
          </Card>

          <Card className="p-4 mt-4 max-w-xl">
            <h3 className="font-bold mb-3">Active Positions</h3>
            {stakingPositions.data && stakingPositions.data.length > 0 ? (
              <div className="space-y-2">
                {stakingPositions.data.map((pos: any) => (
                  <div key={pos.id} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                    <div>
                      <span className="font-semibold">{pos.amount?.toFixed(2)} {pos.token}</span>
                      <span className="text-xs text-muted-foreground ml-2">{pos.apy?.toFixed(1)}% APY</span>
                    </div>
                    {pos.status === "active" ? (
                      <Button size="sm" variant="outline" onClick={() => handleUnstake(pos.id)} disabled={unstake.isPending}>
                        Unstake
                      </Button>
                    ) : (
                      <Badge variant="secondary">{pos.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No staking positions yet.</p>
            )}
          </Card>
        </TabsContent>

        {/* BURNING */}
        <TabsContent value="burn">
          <Card className="p-6 max-w-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" /> Burn Tokens</h3>
            <p className="text-sm text-muted-foreground mb-4">Burning permanently removes tokens from circulation, reducing total supply.</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Token</label>
                <Select value={burnToken} onValueChange={(v) => setBurnToken(v as Token)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOKENS.map((t) => <SelectItem key={t} value={t}>{TOKEN_META[t].emoji} {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Amount to burn</label>
                <Input type="number" value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} placeholder="0.00" />
              </div>
              <Button onClick={handleBurn} disabled={burnTokens.isPending} className="w-full bg-gradient-to-r from-orange-500 to-red-600">
                {burnTokens.isPending ? <Spinner /> : <><Flame className="w-4 h-4 mr-2" /> Burn Tokens</>}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* SWAP */}
        <TabsContent value="swap">
          <Card className="p-6 max-w-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-green-400" /> Swap Tokens (DEX)</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">From</label>
                <div className="flex gap-2">
                  <Select value={fromToken} onValueChange={(v) => setFromToken(v as Token)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TOKENS.map((t) => <SelectItem key={t} value={t}>{TOKEN_META[t].emoji} {t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} placeholder="0.00" className="flex-1" />
                </div>
              </div>
              <div className="flex justify-center">
                <ArrowLeftRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">To</label>
                <Select value={toToken} onValueChange={(v) => setToToken(v as Token)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOKENS.filter((t) => t !== fromToken).map((t) => <SelectItem key={t} value={t}>{TOKEN_META[t].emoji} {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {swapAmount && Number(swapAmount) > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  Estimated rate: 1 {fromToken} ≈ {((getPrice(fromToken)?.priceUsd || 1) / (getPrice(toToken)?.priceUsd || 1)).toFixed(6)} {toToken} · 1% slippage
                </div>
              )}
              <Button onClick={handleSwap} disabled={swap.isPending} className="w-full bg-gradient-to-r from-green-500 to-emerald-600">
                {swap.isPending ? <Spinner /> : <><ArrowLeftRight className="w-4 h-4 mr-2" /> Swap</>}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
