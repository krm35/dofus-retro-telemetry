const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const si = require('systeminformation');
const CryptoJS = require("crypto-js");
const NodeRSA = require('node-rsa');

function hash(text) {
    return crypto.createHash("sha256").update(text).digest().toString('hex')
}

async function getRandomNetworkKey() {
    console.log("generating RandomNetworkKey... (not random at all), ~5 seconds");
    const info = await si.osInfo();
    const uuid = await si.uuid();
    const bios = await si.bios();
    const cpu = await si.cpu();
    const memLayout = await si.memLayout();
    let firstPart = uuid.hardware;
    firstPart += os.type();
    firstPart += bios.vendor;
    firstPart += bios.version;
    firstPart += bios.releaseDate;
    firstPart += cpu.manufacturer;
    firstPart += cpu.brand;
    firstPart += cpu.socket;
    firstPart += cpu.vendor;
    firstPart += cpu.model;
    firstPart += cpu.stepping;
    firstPart += cpu.revision;
    memLayout.forEach(m => firstPart += m.clockSpeed + m.manufacturer + m.serialNum);
    console.log("firstPart", firstPart);
    const randomNetworkKey = hash(firstPart) + ";" + hash(info.hostname);
    console.log("randomNetworkKey", randomNetworkKey);
    return randomNetworkKey;
}

function buildFilesHash() {
    const filesHash = CryptoJS.algo.SHA256.create();

    const files = ["clips/spells/1210.swf", "clips/sprites/1210.swf", "clips/sprites/sprites.xml", "config.xml", "D1Chat.html", "D1Console.html", "D1ElectronLauncher.html", "js/D1Chat.js", "js/D1Console.js", "js/D1ElectronLauncher.js", "loader.swf", "loadingbanners.xml", "preloader.swf"];
    let i;
    for (filesHash.update('cf'), files.sort(), i = 0; i < files.length; i++) {
        filesHash.update(CryptoJS.lib.WordArray.create(fs.readFileSync("C:/Users/" + os.userInfo().username + "/AppData/Local/Ankama/Retro/resources/app/retroclient/" + files[i])));
    }

    return filesHash.finalize().toString(CryptoJS.enc.Base64);
}

function encrypt(toEncrypt, key, iv) {
    const encrypted = (CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(toEncrypt), CryptoJS.enc["Base64"]['parse'](key), {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    }));
    return encrypted['toString']();
}

async function getTelemetry() {
    const privateKey = new NodeRSA(fs.readFileSync("./key"));
    privateKey.$options.encryptionScheme = 'pkcs1';
    const received = "NxMVE5cJAzJ4p9/gczg1sX6gqhAtt7ii3KcoF9rNaYoEELM+Gsk7TIRPh1VHA9SGgQ2MH970hHyKm5O4Oe0fTOaeLZys93/uxr7i0T8W/giUVVjWFn912SSHDtFHb7p+93HUs7NBz5WAqmzVvlk9WxDbZ5ezFSEugaAEaevKG7B1CRb9A5oGDxBMNBLentf9jpc/XORk3wZH1s0vLA0l9PjcO7OCFTG430MGlrAP+UOksaXew+eKKpzpHaijsWTFywENRpiOcdRL2WdWYTXagEZHqQMh5lzFYQuRW8r5VwahlXvPcRqHsEd8uK2xnUIj3XgCdiBZZsyOGoEoE+5EeQ==";
    const receivedDecrypted = privateKey.decrypt(Buffer.from(received, "base64"), "utf8");
    console.log("received", received);
    console.log("receivedDecrypted", receivedDecrypted);
    const [key, user, processToBan] = receivedDecrypted.split('|');
    console.log("key:", key, "| user:", user, "| processToBan:", processToBan);
    let message = buildFilesHash();
    message += "|-1|0|0|";
    message += await getRandomNetworkKey();
    console.log("\nmessageBeforeEncryption", message);
    const iv = CryptoJS.lib.WordArray.random(16);
    const messageEncrypted = encrypt(message, key, iv);
    console.log("\nmessageEncrypted", messageEncrypted + "|" + iv);
}

(async () => {
    await getTelemetry();
})();