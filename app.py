from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.linear_model import LinearRegression

app = Flask(__name__)
CORS(app)

# Initialize model
model = LinearRegression()

# Placeholder for expense data
expense_data = []

@app.route('/predict', methods=['POST'])
def predict():
    global expense_data
    try:
        data = request.get_json()
        new_expense = data.get('amount')
        date_diff = data.get('date_diff')

        # Append new data
        expense_data.append([date_diff, new_expense])
        
        if len(expense_data) > 1:
            # Convert to numpy array
            X = np.array([item[0] for item in expense_data]).reshape(-1, 1)
            y = np.array([item[1] for item in expense_data])
            
            # Train model
            model.fit(X, y)

            # Predict next day's expense
            next_day = np.array([[date_diff + 1]])
            prediction = model.predict(next_day)[0]
            
            return jsonify({'prediction': prediction})
        else:
            return jsonify({'prediction': new_expense})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
