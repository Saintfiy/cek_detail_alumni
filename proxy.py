from flask import Flask, request, jsonify, make_response
import requests
import os
from openai import OpenAI

app = Flask(__name__)

@app.route('/anthropic', methods=['POST', 'OPTIONS'])
def proxy_anthropic():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200
    
    # Handle actual POST request
    api_key = request.headers.get('x-api-key')
    if not api_key:
        response = jsonify({'error': 'API key required'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        return response, 400
    
    # Get the prompt from Anthropic format
    anthropic_data = request.json
    messages = anthropic_data.get('messages', [])
    
    # Extract the user message (the prompt)
    prompt = ""
    for msg in messages:
        if msg.get('role') == 'user':
            prompt = msg.get('content', '')
            break
    
    if not prompt:
        error_response = jsonify({'error': 'No prompt found in messages'})
        error_response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        return error_response, 400
    
    # Use OpenAI API
    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        openai_text = response.choices[0].message.content
        
        # Return in Anthropic format that HTML expects
        anthropic_response = {
            "content": [{
                "text": openai_text,
                "type": "text"
            }],
            "role": "assistant",
            "type": "message"
        }
        
        flask_response = jsonify(anthropic_response)
        flask_response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        return flask_response, 200
        
    except Exception as e:
        error_response = jsonify({'error': f'OpenAI API error: {str(e)}'})
        error_response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        return error_response, 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)