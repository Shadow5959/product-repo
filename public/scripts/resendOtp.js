function resendOtp() {
    const email = document.getElementById('email').value; // Get email

    console.log("Resending OTP for:", email);

    fetch('/resendOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("OTP has been resent successfully. Please check your email.");
        } else {
            alert(data.message || "Failed to resend OTP. Try again.");
        }
    })
    .catch(error => {
        console.error("Error resending OTP:", error);
    });
}

function startResendTimer() {
    let timer = 10; // 10-second countdown
    const timerElement = document.getElementById("timer");
    const resendLink = document.getElementById("resendOtpLink");

    resendLink.style.pointerEvents = "none"; // Disable link click
    resendLink.style.color = "gray"; // Gray out the link
    timerElement.textContent = `Resend in ${timer}s`;

    const countdown = setInterval(() => {
        timer--;
        timerElement.textContent = `Resend in ${timer}s`;

        if (timer <= 0) {
            clearInterval(countdown);
            timerElement.textContent = ""; // Hide timer text
            resendLink.style.pointerEvents = "auto"; // Enable link click
            resendLink.style.color = "blue"; // Change color to indicate it's active
        }
    }, 1000);
}

window.onload = startResendTimer;
