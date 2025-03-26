import cv2
import numpy as np

class ImageEnhancer:
    @staticmethod
    def apply_unsharp_mask(image, intensity):
        # Convert intensity to parameters (0-100 to reasonable ranges)
        radius = 1.0 + (intensity / 50.0)  # 1.0 to 3.0
        amount = 0.5 + (intensity / 50.0)  # 0.5 to 2.5
        threshold = int(intensity / 10)     # 0 to 10
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(image, (0, 0), radius)
        
        # Create mask
        mask = cv2.addWeighted(image, 1.0 + amount, blurred, -amount, 0)
        
        # Apply threshold to reduce noise
        if threshold > 0:
            low_contrast = np.abs(image - blurred) < threshold
            np.copyto(mask, image, where=low_contrast)
        
        return cv2.convertScaleAbs(mask)

    @staticmethod
    def apply_high_boost(image, intensity):
        # Convert intensity to boost factor (1.0 to 3.0)
        boost_factor = 1.0 + (intensity / 50.0)
        
        # Create sharpening kernel
        kernel = np.array([[-1, -1, -1],
                         [-1,  8 + boost_factor, -1],
                         [-1, -1, -1]]) / (boost_factor + 1)
        
        # Apply high-boost filter
        sharpened = cv2.filter2D(image, -1, kernel)
        
        # Combine with original image
        result = cv2.addWeighted(image, 1.0, sharpened, 0.5, 0)
        return cv2.convertScaleAbs(result)

    @staticmethod
    def apply_laplacian(image, intensity):
        intensity_scale = intensity / 50.0
        laplacian = cv2.Laplacian(image, cv2.CV_64F)
        laplacian = cv2.convertScaleAbs(laplacian)
        enhanced = cv2.addWeighted(image, 1.0, laplacian, intensity_scale, 0)
        return cv2.convertScaleAbs(enhanced)

    @staticmethod
    def apply_sobel(image, intensity):
        scale = intensity / 50
        sobelx = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
        gradient = np.sqrt(sobelx**2 + sobely**2) * scale
        return np.uint8(gradient)

    @staticmethod
    def apply_prewitt(image, intensity):
        scale = intensity / 50
        kernelx = np.array([[1,1,1],[0,0,0],[-1,-1,-1]]) * scale
        kernely = np.array([[-1,0,1],[-1,0,1],[-1,0,1]]) * scale
        prewittx = cv2.filter2D(image, -1, kernelx)
        prewitty = cv2.filter2D(image, -1, kernely)
        return cv2.addWeighted(prewittx, 0.5, prewitty, 0.5, 0)

    @staticmethod
    def enhance(image, method='unsharp_mask', intensity=50):
        methods = {
            'unsharp_mask': ImageEnhancer.apply_unsharp_mask,
            'high_boost': ImageEnhancer.apply_high_boost,
            'laplacian': ImageEnhancer.apply_laplacian,
            'sobel': ImageEnhancer.apply_sobel,
            'prewitt': ImageEnhancer.apply_prewitt
        }
        
        if method not in methods:
            raise ValueError(f"Method {method} not supported")
            
        return methods[method](image, intensity)