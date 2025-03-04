 function submitCategory(event) {
    event.preventDefault();
    
    const form = document.getElementById('category-form');
    const formData = new FormData(form);
    
    const name = formData.get('name').trim();
    const description = formData.get('description') ? formData.get('description').trim() : ""; // Optional description
    
    // Validate Name (Required)
    if (!name) {
        alert("Please enter a category name.");
        return;
    }
    
    const data = { name, description };
    
    fetch('/addCat', {
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
            // Redirect without showing an alert
            window.location.href = "/categoryList";
        } else {
            alert('❌ Error: ' + (data.message || 'Category save failed'));
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('⚠️ An unexpected error occurred. Please try again.');
    });
}