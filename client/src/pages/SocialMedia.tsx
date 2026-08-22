import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Users } from "lucide-react";
import DirectMessagesPanel from "@/components/DirectMessagesPanel";

export default function SocialMedia() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "trending" | "profile" | "messages">("feed");
  const [selectedPostForComment, setSelectedPostForComment] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState("");

  const { data: feed } = trpc.social.getFeed.useQuery({ limit: 50 });
  const { data: trending } = trpc.social.getTrending.useQuery({ limit: 20 });
  const { data: userPosts } = trpc.social.getUserPosts.useQuery(
    { userId: user?.id || 0, limit: 50 },
    { enabled: !!user }
  );
  const { data: userProfile } = trpc.social.getUserProfile.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );
  const { data: userStats } = trpc.social.getUserStats.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );
  const { data: postComments } = trpc.social.getComments.useQuery(
    { postId: selectedPostForComment || 0, limit: 20 },
    { enabled: !!selectedPostForComment }
  );

  const createPostMutation = trpc.social.createPost.useMutation();
  const toggleLikeMutation = trpc.social.toggleLike.useMutation();
  const followUserMutation = trpc.social.followUser.useMutation();
  const addCommentMutation = trpc.social.addComment.useMutation();

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    await createPostMutation.mutateAsync({ content: postContent });
    setPostContent("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Social Hub</h1>
          <p className="text-slate-400">Connect, share, and grow with the community</p>
        </div>

        {/* Create Post */}
        {user && (
          <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 mb-4"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" className="border-slate-600">Cancel</Button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!postContent.trim()}
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {["feed", "trending", "profile", "messages"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === tab
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Direct messages */}
        {activeTab === "messages" && user && <DirectMessagesPanel currentUserId={user.id} />}

        {/* Feed */}
        {activeTab === "feed" && (
          <div className="space-y-4">
            {feed?.map((post: any) => (
              <Card key={post.id} className="bg-slate-800 border-slate-700 p-6 hover:border-slate-600 transition-colors">
                <div className="flex gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {post.userId}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">User #{post.userId}</p>
                    <p className="text-sm text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <p className="text-slate-200 mb-4">{post.content}</p>

                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full rounded-lg mb-4 max-h-96 object-cover"
                  />
                )}

                <div className="flex gap-6 text-slate-400 border-t border-slate-700 pt-4">
                  <button
                    onClick={() => toggleLikeMutation.mutate({ postId: post.id })}
                    className="flex items-center gap-2 hover:text-red-400 transition-colors"
                  >
                    <Heart size={18} />
                    <span>{post.likes || 0}</span>
                  </button>
                  <button
                    onClick={() => setSelectedPostForComment(selectedPostForComment === post.id ? null : post.id)}
                    className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
                  >
                    <MessageCircle size={18} />
                    <span>{post.comments || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                    <Share2 size={18} />
                    <span>Share</span>
                  </button>
                </div>
                
                {/* Comments section */}
                {selectedPostForComment === post.id && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="mb-4">
                      {postComments?.map((comment: any) => (
                        <div key={comment.id} className="mb-2 p-2 bg-slate-700 rounded">
                          <p className="text-sm text-slate-300"><strong>User #{comment.userId}:</strong> {comment.content}</p>
                        </div>
                      ))}
                    </div>
                    {user && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400 px-2 py-1 rounded text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (commentContent.trim()) {
                              addCommentMutation.mutate({ postId: post.id, content: commentContent });
                              setCommentContent("");
                            }
                          }}
                          className="bg-cyan-500 hover:bg-cyan-600"
                        >
                          Post
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Trending */}
        {activeTab === "trending" && (
          <div className="space-y-4">
            {trending?.map((post: any, idx: number) => (
              <Card key={idx} className="bg-slate-800 border-slate-700 p-6 hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-bold text-cyan-400">#{idx + 1}</div>
                  <div>
                    <p className="font-semibold text-white">{post.content?.substring(0, 50)}...</p>
                    <p className="text-sm text-slate-400">{post.likes || 0} likes</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Profile */}
        {activeTab === "profile" && user && (
          <div>
            <Card className="bg-slate-800 border-slate-700 p-8 text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                {user.name?.charAt(0) || "U"}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
              <p className="text-slate-400 mb-6">{user.email}</p>
              <div className="flex gap-8 justify-center mb-6">
                <div>
                  <p className="text-2xl font-bold text-cyan-400">{userStats?.posts || 0}</p>
                  <p className="text-slate-400">Posts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{userStats?.followers || 0}</p>
                  <p className="text-slate-400">Followers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">{userStats?.following || 0}</p>
                  <p className="text-slate-400">Following</p>
                </div>
              </div>
              <div className="text-sm text-slate-400 mb-4">
                <p>Total engagement: {userStats?.engagement?.toFixed(2) || 0}</p>
              </div>
            </Card>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Your Posts</h3>
              <div className="space-y-4">
                {userPosts?.map((post: any) => (
                  <Card key={post.id} className="bg-slate-800 border-slate-700 p-6">
                    <p className="text-slate-200 mb-4">{post.content}</p>
                    <p className="text-xs text-slate-500 mb-3">{new Date(post.createdAt).toLocaleDateString()}</p>
                    <div className="flex gap-6 text-slate-400">
                      <button
                        onClick={() => toggleLikeMutation.mutate({ postId: post.id })}
                        className="flex items-center gap-2 hover:text-red-400 transition-colors"
                      >
                        <Heart size={18} />
                        {post.likes || 0}
                      </button>
                      <span className="flex items-center gap-2">
                        <MessageCircle size={18} />
                        {post.comments || 0}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
