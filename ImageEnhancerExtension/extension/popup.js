document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const controls = document.getElementById('controls');
    const result = document.getElementById('result');
    const enhancedImage = document.getElementById('enhancedImage');
    const intensitySlider = document.getElementById('intensity');
    const intensityValue = document.getElementById('intensityValue');
    const applyBtn = document.getElementById('applyBtn');
    let originalImageData = null;

    // Update intensity value display
    intensitySlider.addEventListener('input', () => {
        intensityValue.textContent = intensitySlider.value;
    });

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Handle drop
    dropZone.addEventListener('drop', async (e) => {
        preventDefaults(e);
        
        let imageData;
        try {
            const file = e.dataTransfer.files[0];
            if (!file || !file.type.startsWith('image/')) {
                alert('Please drop a valid image file!');
                return;
            }
            
            // Read the file and display it
            const reader = new FileReader();
            reader.onload = function(event) {
                originalImageData = event.target.result;
                enhancedImage.src = originalImageData;
                dropZone.classList.add('hidden');
                controls.classList.remove('hidden');
                result.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error handling drop:', error);
            alert('Error processing the image. Please try again.');
        }
    });

    // Handle apply button click
    applyBtn.addEventListener('click', async () => {
        if (!originalImageData) return;

        try {
            const response = await fetch('http://localhost:5000/enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: originalImageData,
                    method: document.getElementById('enhanceMethod').value,
                    intensity: parseInt(intensitySlider.value)
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                enhancedImage.src = data.image;
                
                // Store in history with 3-item limit
                chrome.storage.local.get(['enhanced_images'], (result) => {
                    let images = result.enhanced_images || [];
                    images.unshift({
                        data: data.image,
                        timestamp: Date.now()
                    });
                    images = images.slice(0, 3); // Keep only last 3 images
                    chrome.storage.local.set({ 'enhanced_images': images }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Storage limit reached, removing oldest item');
                            images.pop(); // Remove the last item if storage limit is reached
                            chrome.storage.local.set({ 'enhanced_images': images });
                        }
                        loadHistory();
                    });
                });
            }
        } catch (error) {
            console.error('Error enhancing image:', error);
            alert('Error enhancing the image. Please try again.');
        }
    });

    // Reset button handler
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (originalImageData) {
            enhancedImage.src = originalImageData;
        }
    });

    // Download button handler
    document.getElementById('downloadBtn').addEventListener('click', () => {
        if (enhancedImage.src) {
            const link = document.createElement('a');
            link.href = enhancedImage.src;
            link.download = 'enhanced_image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    // Load history function
    function loadHistory() {
        chrome.storage.local.get(['enhanced_images'], (result) => {
            const historyItems = document.getElementById('historyItems');
            historyItems.innerHTML = '';
            
            if (result.enhanced_images && result.enhanced_images.length > 0) {
                result.enhanced_images.forEach((item) => {
                    const div = document.createElement('div');
                    div.className = 'history-item';
                    const date = new Date(item.timestamp).toLocaleString();
                    div.innerHTML = `
                        <div class="history-image">
                            <img src="${item.data}" alt="Enhanced image">
                        </div>
                        <div class="history-info">
                            <span class="history-date">${date}</span>
                            <button class="history-download" data-image="${item.data}">Download</button>
                        </div>
                    `;
                    
                    // Add click handler for download button
                    const downloadBtn = div.querySelector('.history-download');
                    downloadBtn.addEventListener('click', function() {
                        const imageData = this.getAttribute('data-image');
                        const link = document.createElement('a');
                        link.href = imageData;
                        link.download = `enhanced_image_${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    });

                    historyItems.appendChild(div);
                });
            } else {
                historyItems.innerHTML = '<p class="no-history">No recent enhancements</p>';
            }
        });
    }

    // Initialize history on load
    loadHistory();

    // New Image button handler
    document.getElementById('newImageBtn').addEventListener('click', () => {
        dropZone.classList.remove('hidden');
        controls.classList.add('hidden');
        result.classList.add('hidden');
        originalImageData = null;
        enhancedImage.src = '';
    });

    // Check for pending image from right-click
    chrome.storage.local.get(['pendingImage'], (result) => {
        if (result.pendingImage) {
            originalImageData = result.pendingImage;
            enhancedImage.src = originalImageData;
            dropZone.classList.add('hidden');
            controls.classList.remove('hidden');
            result.classList.remove('hidden');
            
            // Clear the pending image
            chrome.storage.local.remove('pendingImage');
        }
    });
});