# A simple Python script for data processing or utility

def process_data(data):
    return [x * 2 for x in data]

if __name__ == "__main__":
    sample_data = [1, 2, 3, 4, 5]
    processed = process_data(sample_data)
    print(f"Original data: {sample_data}")
    print(f"Processed data: {processed}")
