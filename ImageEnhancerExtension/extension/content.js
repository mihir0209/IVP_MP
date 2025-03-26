// Add drag functionality to all images on the page
document.addEventListener('DOMContentLoaded', () => {
    const images = document.getElementsByTagName('img');
    Array.from(images).forEach(img => {
        img.setAttribute('draggable', 'true');
        img.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', img.src);
        });
    });
});