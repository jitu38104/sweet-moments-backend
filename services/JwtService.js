const jwt = require('jsonwebtoken');

class JwtService {
    static sign(payload, secret = process.env.JWT_SECRET, expiry = '1d') {
        return jwt.sign(payload, secret, { expiresIn: expiry });
    }

    static varify(token, secret = process.env.JWT_SECRET) {
        return jwt.verify(token, secret);
    }
}

module.exports = JwtService;