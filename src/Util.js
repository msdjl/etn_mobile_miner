class Util {
    static generateDeviceId() {
        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randNumber = () => String.fromCharCode(rand(48, 57));
        const randLetter = () => String.fromCharCode(rand(97, 122));
        const idLength = 16;
        let result = randLetter(); // let the first char be a letter. don't know why
        for (let i = 1; i < idLength; i++) {
            result += Math.random() > 0.5 ? randLetter() : randNumber();
        }
        return result;
    }
}

module.exports = Util;