/**
 * @typedef {"empty_field_detected"} EmptyFieldDetected ข้อความเตือนว่าผู้ใช้กรอกข้อมูลไม่ครบถ้วน
 * @typedef {"required_field_missing"} RequiredFieldMissing ข้อความเตือนว่าผบางฟิลด์ข้อมูลที่จำเป็นขาดหายไป
 * 
 * @typedef {EmptyFieldDetected|RequiredFieldMissing} ErrorMessage ข้อความเตือนที่ส่งให้ฝั่งไคลเอ็นท์
 * 
 **/
/**
 * สร้างอ็อปเจคแสดงข้อความเตือน
 * @param {ErrorMessage} message ข้อความเตือนที่ส่งให้ฝั่งไคลเอ็นท์
 * @returns 
 */
function createErrorMessage(message) {
    return { 'error': message, };
}

module.exports = {
    createErrorMessage,
}