const changePassword = require("./changePassword")
const createResetTokenForUser = require('./createResetTokenForUser')
const login = require('./login')
const resetPassword = require('./resetPassword')
const signup = require('./signup')
const verifyEnable2FA = require('./verifyEnable2FA')
const enable2FA = require('./enable2A')
const verifyLoginOTP = require('./verifyLoginOTP')

module.exports = {
    changePassword,
    createResetTokenForUser,
    login,
    resetPassword,
    signup,
    verifyEnable2FA,
    enable2FA,
    verifyLoginOTP
}