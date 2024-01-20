/**
 * ฟังกชันสำหรับการตรวจสอบการเข้าสู่ระบบ
 * @param {*} body 
 */
async function authenticate(body = null) {
    await initLiff();
    const auth = getAuthToken();
    const headers = {
        'content-type': 'application/x-www-from-urlencoded',
    };

    if (auth) {
        headers['authorization'] = `Bearer ${auth}`;
    }

    const res = await fetch('/login', {
        method: 'POST',
        headers,
        body,
    });

    if (res.status != 200) {
        let params = new URLSearchParams(await res.text());
        if (params.has('redirect')) location.assign(params.get('redirect'));
        throw res.status;
    }
}

/**
 * ใช้งาน Line LIFF API 
 * 
 * @returns {Promise<string>}
 */
async function initLiff() {
    try {
        if(!liff.isInClient()) return;

        await liff.init({ liffId: '1656071963-6OqLKl7G' });
    } catch (error) {
        console.error(error);
    }
}

/**
 * รับค่าโทเค่น
 * @returns {string?}
 */
async function getAuthToken(){
    if(!liff.isInClient()) return localStorage.getItem('authorization');

    return liff.getIDToken();
}

/**
 * ร้องขอการเข้าสู่เว็บไซต์ผ่าน URL
 * @param {String} url
 * @param {*} body 
 */
async function POST(url, body = null) {
    let auth = getAuthToken();
    let headers = {};

    if (auth) {
        headers['authorization'] = `Bearer ${auth}`;
    }

    switch (typeof body) {
        case 'object':
            headers['content-type'] = 'application/json';
            body = JSON.stringify(body);
            break;
        case 'function':
            body = body();
            if (typeof body == 'object') {
                headers['content-type'] = 'application/json';
                body = JSON.stringify(body);
            }
            break;
        case 'bigint':
            body = body.toString();
            break;
        default:
            body = body === null ? null : String(body);
            break;
    }

    let res = await fetch(url, {
        method: 'POST',
        headers,
        body,
    });

    if (res.status != 200) {
        throw res.status;
    }

    return res;
}

/**
 * ร้องขอการเข้าสู่เว็บไซต์ผ่าน URL
 * @param {String} url
 * @param {*} body 
 */
async function GET(url) {
    let auth = getAuthToken();
    let headers = {};

    if (auth) {
        headers['authorization'] = `Bearer ${auth}`;
    }

    let res = await fetch(url, {
        method: 'GET',
        headers,
    });

    if (res.status != 200) {
        throw res.status;
    }

    return res;
}

/**
 * @typedef {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} InputElement
 */

/**
 * บังคับให้เอเลเมนต์ดังกล่าวอยู่ในสถานะ disabled
 * @param {InputElement[]} inputs 
 * @param {Boolean} [disabled=true] สถานะ disabled
 */
function disableElements(elements, disabled = true) {
    for (let i of elements) {
        i.disabled = !!disabled;
    }
}

/**
 * @typedef {StringConstructor|NumberConstructor|DateConstructor|ObjectConstructor} DataBindingRule
 * @typedef {Object<string, DataBindingRule>} DataBindingRules
 * 
 */

/** 
 * ทำการผูกเอเลเมนต์ไว้กับออปเจ็คสำหรับจัดการข้อมูลที่ผู้ใช้กรอก
 * 
 * @param {DataBindingRules} rules รายชื่อสำหรับบ่งบอกประเภทข้อมูลที่ควรได้รับจากเอเลเมนต์ตามแอตทริบิวต์ id หรือ name
 * @param {InputElement[]} inputs 
 */
function bindDataToInputs(rules, inputs) {

    const data = {};
    const bind = {};

    for (let el of inputs) {

        let name = el.id || el.name;

        if (!(name in rules) || !name) continue;

        data[name] = null;
        switch (rules[name]) {
            case Date:
                let v = new Date(el.value);
                data[name] = v;
                el.addEventListener('input', ev => {
                    let d = new Date(el.value);
                    v.setTime(d.getTime());
                });

                Object.defineProperty(bind, name, {
                    get: () => v,
                    set(x) {
                        let d = new Date(x);
                        v.setTime(d.getTime());
                        switch (el.type) {
                            case 'date':
                                el.value = isNaN(d.getTime()) ? '' : d.toJSON().replace(/T.*$/g, '');
                                break;

                            default:
                                el.value = d.toJSON().replace(/T.*$/g, '');
                                break;
                        }

                    },
                    enumerable: true,
                });
                break;
            case Number:
                data[name] = Number(el.value);

                el.addEventListener('input', ev => {
                    data[name] = Number(el.value);
                });

                Object.defineProperty(bind, name, {
                    get: () => data[name],
                    set(x) {
                        let n = Number(x);
                        data[name] = n;
                        el.value = n;
                    },
                    enumerable: true,
                });
                break;
            default:
                data[name] = el.value;
                el.addEventListener('input', ev => {
                    data[name] = el.value || null;
                });

                Object.defineProperty(bind, name, {
                    get: () => data[name],
                    set(x) {
                        data[name] = x == null ? null : String(x);
                        el.value = x == null ? '' : String(x);
                    },
                    enumerable: true,
                });
        }
    }

    return bind;
}

/**
 * ปิดไดอะล็อก
 * @this {HTMLElement}
 */
function closeModal() {
    let p = this.parentElement;
    while (p) {
        if (p instanceof HTMLDialogElement && typeof p.close == 'function') {
            p.close();
            return;
        }
        p = p.parentElement;
    }
}


const getTemplate = (() => {
    let tl = document.querySelectorAll('template');
    return getTemplate;

    /**
     * ค้นหาเอเลเมนต์ template ทีได้รวบรวมหลังจากโหลดหน้าเว็บสำเร็จแล้วด้วยตัวบงชี้
     * @param {String} identifier จะใช้ตัวบ่งชี้เป็นค่า id หรือ name ก็ได้
     * @returns 
     */
    function getTemplate(identifier) {
        /** @type {HTMLTemplateElement} */
        let name;
        for (let t of tl) {
            if (t.id == identifier) return t;

            if (t.getAttribute('name') == identifier && !name) name = t;
        }

        return name || null;
    };
})();
