import jwt from 'jsonwebtoken';

const genToken = async (UserID) => {
    try {
        const token = jwt.sign({ UserID }, process.env.JWT_SECRET, { expiresIn: '10d' });
        return token;
    } catch (error) {
        console.log(error);
    }    
}

export default genToken;
