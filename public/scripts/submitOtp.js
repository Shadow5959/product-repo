function submitOtp(event) {
    event.preventDefault();
    const otp = document.getElementById('otp').value;
    const email = document.getElementById('email').value; // Ensure this gets the actual email

    console.log(otp, email);

    fetch('/otpVerify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp, email })
    })
        .then(response => response.json()) // Parse JSON response
        .then(data => {
            if (data.success) {
                // Redirect to login page if OTP verification is successful
                window.location.href = '/login';
            } else {
                // Show error message if OTP is invalid
                alert(data.message || "Invalid OTP. Please try again.");
            }
        })
        .catch(error => {
            console.error("Error verifying OTP:", error);
        });
}