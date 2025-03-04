function submitforgetOtp(event) {
    event.preventDefault(); // Prevents default form submission
    const otp = document.getElementById('otp').value;
    const email = document.getElementById('email').value;

    fetch('/forgetPasswordVerify', {  
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp, email })
    })
    .then(response => {
        console.log('Raw response:', response);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Success:', data);
            alert('OTP verified successfully!');
            window.location.href = `/reset-password?email=${encodeURIComponent(email)}`;
        } else {
            alert('Invalid OTP. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
}