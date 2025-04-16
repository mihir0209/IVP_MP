from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from PIL import Image
import io
import base64
from image_processing.enhancer import ImageEnhancer

app = Flask(__name__)
CORS(app)

@app.route('/enhance', methods=['POST'])
def enhance_image():
    try:
        data = request.json
        image_data = data['image']
        method = data.get('method', 'sharpen')
        intensity = float(data.get('intensity', 50))
        
        # Convert base64 to image
        image_data = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_data))
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Remove selective_blur logic
        enhanced = ImageEnhancer.enhance(opencv_image, method, intensity)
        
        # Convert back to PIL Image
        enhanced_image = Image.fromarray(cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB))
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        enhanced_image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        # Convert to base64
        enhanced_base64 = base64.b64encode(img_byte_arr).decode()
        
        return jsonify({
            'status': 'success',
            'image': f'data:image/png;base64,{enhanced_base64}'
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)