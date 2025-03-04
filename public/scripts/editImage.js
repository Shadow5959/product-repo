function uploadImages(event) {
    const files = event.target.files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
        .then(data => {
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.innerHTML = '';
            data.imageUrls.forEach(url => {
                const img = document.createElement('img');
                const button = document.createElement('button');
                button.innerText = 'Delete';
                button.style.display = 'block';
                button.style.marginTop = '5px';
                button.onclick = () => {
                  img.remove();
                  button.remove();
                  fetch('/delete-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
                })
                .then(response => response.json())
                .then(data => {
                if (data.success) {
                  console.log('Image deleted successfully');
                } else {
                  console.error('Failed to delete image');
                }
                })
                .catch((error) => {
                console.error('Error:', error);
                });
              
                  
                };
                const div = document.createElement('div');
                div.appendChild(img);
                div.appendChild(button);
                imagePreview.appendChild(div);
                img.src = url;
                img.style.width = '150px';
                img.style.margin = '5px';
                imagePreview.appendChild(img);
            });
        })
    .catch((error) => {
        console.error('Error:', error);
    });
}
