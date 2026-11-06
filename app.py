from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'heart_disease_model.pkl')
model = joblib.load(MODEL_PATH)

app = Flask(__name__)

FEATURES = ['age','sex','cp','trestbps','chol','fbs','restecg','thalach','exang','oldpeak','slope','ca','thal']

@app.get('/')
def home():
    return render_template('index.html')

@app.post('/predict')
def predict():
    try:
        payload = request.get_json(force=True)
        row = {k: float(payload[k]) for k in FEATURES}
        df = pd.DataFrame([row], columns=FEATURES)
        pred = int(model.predict(df)[0])
        probability = float(model.predict_proba(df)[0, 1])
        return jsonify({
            'prediction': pred,
            'probability': round(probability * 100, 2),
            'label': 'Heart disease indicated' if pred == 1 else 'No heart disease indicated'
        })
    except Exception as exc:
        return jsonify({'error': str(exc)}), 400

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
