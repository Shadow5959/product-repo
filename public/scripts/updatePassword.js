function updatePassword(event) {
    event.preventDefault(); // Prevent form from auto-submitting
    const email = document.getElementById('email').value;
    const upassword = document.getElementById('upassword').value;
    const cupassword = document.getElementById('cupassword').value;
    if (!/(?=.*[A-Z])(?=.*\W).{8,32}/.test(upassword)) {
        alert("Password must be 8-32 characters long, contain at least one uppercase letter and one special character.");
        return;
    }
    if (upassword !== cupassword) {
        alert("Passwords do not match.");
        return;
    }
    console.log({ email, upassword, cupassword });

    fetch('/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, upassword, cupassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Password updated successfully");
            window.location.href = '/login';
        } else {
            alert("Error updating password: " + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Error updating password");
    });
}