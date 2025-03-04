function clearFilters() {
    // Uncheck all checkboxes
    document.querySelectorAll('.form-check-input').forEach(checkbox => {
        checkbox.checked = false;
    });
}
function applyFilters() {
    // Get all checked checkboxes
    const checkedCategories = Array.from(document.querySelectorAll('.form-check-input:checked'))
        .map(checkbox => checkbox.id);
    // Redirect to the same page with the selected categories as query parameters
    window.location.href = `/products?categories=${checkedCategories.join(',')}`;
}

// Function to retain checked checkboxes based on URL parameters
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const categories = urlParams.get('categories');
    if (categories) {
        const categoryArray = categories.split(',');
        categoryArray.forEach(catId => {
            const checkbox = document.getElementById(catId);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
}
function toggleFilter() {
        const filterCard = document.getElementById('filterCard');
        const toggleFilterBtn = document.getElementById('toggleFilterBtn');
        if (filterCard.style.display === 'none') {
            filterCard.style.display = 'block';
            toggleFilterBtn.textContent = 'Hide Filters';
        } else {
            filterCard.style.display = 'none';
            toggleFilterBtn.textContent = 'Show Filters';
        }
    }