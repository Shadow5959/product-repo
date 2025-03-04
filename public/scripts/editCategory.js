function editCategory(event, cat_id) {
    event.preventDefault();
    
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-description').value.trim(); // Optional

    // Validate Name (Required)
    if (!name) {
        alert("Please enter a category name.");
        return;
    }

    const data = { name, description };

    fetch(`/editcat/${cat_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
        })
        .then(data => {
        console.log(data);
        if (data.success) {
            window.location.href = "/categoryList"; // Redirect on success
        } else {
            alert('❌ Error: ' + (data.message || 'Category save failed'));
        }
        })
        .catch((error) => {
        console.error('Error:', error);
        alert('⚠️ An unexpected error occurred. Please try again.');
        });
    }
