const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
require("dotenv").config();

function generateOTP(){
    return randomstring.generate({
        length: 6 ,
        charset: 'numeric'
    })
}


function sendOTP(email, otp){
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'OTP for Email Verification',
        text: `Your OTP is ${otp}`
    };
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if(error){
            console.log('Error Occured', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


module.exports = { sendOTP, generateOTP };