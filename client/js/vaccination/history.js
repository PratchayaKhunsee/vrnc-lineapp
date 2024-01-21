(() => {
    authenticate(new URLSearchParams({
        'redirect': `/vaccination/history`,
    }).toString()).then(x => {
        onrendered();
    });

    const succussfulDeletionTemplate = getTemplate('successful-deletion');
    const failedDeletionTemplate = getTemplate('failed-deletion');
    const deletionDialogTemplate = getTemplate('deletion-dialog');
    const listItem = getTemplate('list-item');
    const menu = getTemplate('menu');
    const notFoundItem = getTemplate('not-found-item');
    const mainElement = document.querySelector('main');

    /**
     * @type {Map<HTMLElement, String>}
     */
    const itemIds = new Map();
    /**
     * @type {Map<String, HTMLElement>}
     */
    const vaccinationElements = new Map();

    /**
     * @this {HTMLElement}
     */
    function deleteThis() {
        const id = itemIds.get(this);
        if (typeof id !== 'string') return;

        const cloned = deletionDialogTemplate.content.cloneNode(true);
        const children = [...cloned.childNodes];
        mainElement.appendChild(cloned);

        for (let c of children) {

            if (c instanceof HTMLDialogElement) {

                const actions = c.querySelectorAll('[data-action]');

                /**
                 * @param {MouseEvent} e 
                 */
                function onClose(e) {
                    e.preventDefault();
                    c.close();
                    c.remove();
                    c.removeEventListener('click', onClose);
                }

                /**
                 * @param {MouseEvent} e 
                 */
                async function onConfirm(e) {
                    e.preventDefault();
                    c.close();
                    c.remove();
                    c.removeEventListener('click', onConfirm);

                    document.body.classList.add('prevent-prompt');

                    // await new Promise((resolve) => setTimeout(() => resolve(), 1500));
                    let success = false;
                    try {
                        const res = await POST('/vaccination/remove', { id });
                        const result = await res.json();

                        if (res instanceof Response && res.status == 200 && (result === true || (typeof result === 'object' && result['status'] === true))) {
                            success = true;
                        }
                    } catch (e) { console.error(e); }


                    document.body.classList.remove('prevent-prompt');

                    const element = vaccinationElements.get(id);

                    if (success) {
                        if (element instanceof HTMLElement) element.remove();
                    }

                    const popup = (success ? succussfulDeletionTemplate : failedDeletionTemplate).content.cloneNode(true);
                    const children = [...popup.childNodes];
                    mainElement.appendChild(popup);
                    setTimeout(() => {
                        for (let n of children) n.remove();
                    }, 4000);
                }

                for (const btn of actions) {
                    const dataset = btn.dataset;
                    if (!(dataset instanceof DOMStringMap)) continue;
                    switch (dataset['action']) {
                        case 'close':
                            btn.addEventListener('click', onClose);
                            break;
                        case 'confirm':
                            btn.addEventListener('click', onConfirm);
                            break;
                        default:
                            break;
                    }
                }

                c.showModal();
                c.addEventListener("click", function onDialogClick(e) {
                    e.preventDefault();
                    const rect = this.getBoundingClientRect();

                    if ((e.clientX < rect.left || e.clientX > rect.left + rect.width) ||
                        (e.clientY < rect.top || e.clientY > rect.top + rect.height)) {
                        this.close();
                        this.remove();

                        this.removeEventListener("click", onDialogClick);
                    }
                });
                break;

            }
        }
    }

    /**
     * @this {HTMLElement}
     */
    function editThis() {
        const id = itemIds.get(this);
        if (typeof id !== 'string') return;
        location.assign('/vaccination/edit?id=' + id);
    }

    async function onrendered() {
        document.body.classList.add('ready');


        const mainCloned = getTemplate('main').content.cloneNode(true);

        try {
            const res = await GET('/vaccination/list');
            const vaccination = await res.json();

            if (!(vaccination instanceof Array) || vaccination.length == 0) {
                mainElement.appendChild(notFoundItem.content.cloneNode(true));
                return;
            }

            /** @type {HTMLDivElement?} */
            let firstChild;

            for (let o of mainCloned.childNodes) {
                if (o instanceof HTMLDivElement) {
                    firstChild = o;
                    break;
                }
            }

            if (!(firstChild instanceof HTMLElement)) return;

            for (let n of vaccination) {
                const item = listItem.content.cloneNode(true);
                /** @type {String?} */
                const id = typeof n.key == 'string' ? n.key : n.id;
                const values = n.value !== null && typeof n.value == 'object' ? n.value : n;
                /** @type {HTMLDetailsElement?} */
                let details;

                for (let o of item.childNodes) {
                    if (o instanceof HTMLElement) {
                        details = o.querySelector('details');
                        break;
                    }
                }

                if (!(details instanceof HTMLDetailsElement)) continue;

                const vaccination_date = new Date(values.vaccination_date);

                details.querySelector('[name=vaccine_name]').appendChild(new Text(values.vaccine_name || '<ไม่ระบุ>'));
                details.querySelector('[name=vaccine_brand]').appendChild(new Text(values.vaccine_brand || '-'));
                details.querySelector('[name=vaccination_date]').appendChild(new Text(isNaN(vaccination_date.getTime()) ? '-' : vaccination_date.toLocaleDateString()));
                details.querySelector('[name=vaccination_address]').appendChild(new Text(values.vaccination_address || '-'));

                const editBtn = details.querySelector('button');

                itemIds.set(editBtn, id);
                editBtn.addEventListener('click', editThis);
                const deleteBtn = editBtn.nextElementSibling;

                if (deleteBtn instanceof HTMLButtonElement) {
                    itemIds.set(deleteBtn, id);
                    vaccinationElements.set(id, details);
                    deleteBtn.addEventListener('click', deleteThis);
                }

                firstChild.appendChild(item);
            }

            firstChild.insertBefore(menu.content.cloneNode(true), firstChild.firstChild);

            mainElement.appendChild(mainCloned);

        } catch (error) {
            console.error(error);
        }
    }
})();