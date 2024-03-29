(() => {
    authenticate(new URLSearchParams({
        'redirect': `/vaccination`,
    }).toString()).then(x => {
        onrendered();
    });

    async function onrendered() {
        document.body.classList.add('ready', 'with-bg');

        const params = new URLSearchParams(location.search);
        const main = document.querySelector('main');
        const invalidAlertDialog = getTemplate('invalid-alertdialog');
        const failedPopup = getTemplate('failed-submit');
        const successPopup = getTemplate('successful-submit');

        main.appendChild(getTemplate('main').content.cloneNode(true));

        const form = main.querySelector('form');
        const data = bindDataToInputs({
            'vaccine_name': String,
            'vaccine_brand': String,
            'vaccination_date': Date,
            'vaccination_address': String,
        }, form.elements);

        disableElements(form.elements, true);

        try {
            const id = params.get('id');
            if (typeof id !== 'string') throw id;

            const res = await POST('/vaccination/retrieve', { id });

            const vaccination = await res.json();

            for (let n in vaccination) {
                data[n] = vaccination[n];
            }
        } catch (error) {
            let invalidDialogNode = invalidAlertDialog.content.cloneNode(true);
            let children = [...invalidDialogNode.childNodes];
            main.appendChild(invalidDialogNode);
            for (let c of children) {
                if (c instanceof HTMLDialogElement) {
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
                }
            }
            return;
        }

        disableElements(form.elements, false);

        form.addEventListener('submit', async function (ev) {
            ev.preventDefault();
            disableElements(form.elements, true);

            try {
                const res = await POST('vaccination/save', { ...data, id: params.get('id') });

                let result = await res.json();

                if (result.error) {
                    let popup = failedPopup.content.cloneNode(true);
                    let children = [...popup.childNodes];
                    main.appendChild(popup);
                    setTimeout(() => {
                        for (let n of children) main.removeChild(n);
                    }, 4000);
                } else {
                    let popup = successPopup.content.cloneNode(true);
                    let children = [...popup.childNodes];
                    main.appendChild(popup);
                    setTimeout(() => {
                        for (let n of children) main.removeChild(n);
                    }, 4000);
                }

                switch (result.error) {
                    case 'empty-field-detected':
                        for (let el of form.elements) {
                            if (el.classList.contains('msg') && el.value == "") {
                                el.classList.add('empty-field-detected');
                            } else {
                                el.classList.remove('empty-field-detected');
                            }

                        }
                        break;
                    default: {
                        for (let el of form.elements) {
                            el.classList.remove(['empty-field-detected']);
                        }
                    }
                }

            } catch (error) {
            }

            disableElements(form.elements, false);
        });
    }

})();