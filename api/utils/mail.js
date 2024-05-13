const nodemailer = require('nodemailer')

const sendEmail = async (email, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: 'tacarbonfootprint@gmail.com',
        pass: 'qdattouaznipndjn',
      },
    })

    const mailOptions = {
      from: 'tacarbonfootprint@gmail.com',
      to: email,
      subject: 'Password Akun Carbon Supply Chain',
      text: text,
    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log('gagal')
      } else {
        console.log('Email sent: ' + info.response)
      }
    })
  } catch (error) {
    console.log('Error')
  }
}

module.exports = { sendEmail }
