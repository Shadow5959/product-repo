function submitForm(event) {
    event.preventDefault();
    const form = document.getElementById('edit-form');
    const formData = new FormData(form);
    
    const imagePreview = document.getElementById('imagePreview');
    const imageUrls = Array.from(imagePreview.getElementsByTagName('img')).map(img => img.src);
    const selectedCategories = Array.from(document.querySelectorAll('.item.checked .item-text')).map(item => item.textContent);
    const data = {
        name: formData.get('name'),
        price: formData.get('price'),
        description: formData.get('description'),
        images: imageUrls,
        product_id: formData.get('product_id'),
        categories: selectedCategories
    };

    fetch(`/editproduct/${data.product_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.success) {
            alert('Product saved successfully');
        } else {
            alert('Product save failed');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
