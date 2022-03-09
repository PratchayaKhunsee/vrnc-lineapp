(() => {
    authenticate(new URLSearchParams({
        'redirect': `/userinfo`,
    }).toString()).then(x => {
        onrendered();
    });

    async function onrendered() {
        document.body.classList.add('ready');

        const main = document.querySelector('main');
        const failedPopup = getTemplate('failed-submit');
        const successPopup = getTemplate('successful-submit');

        main.appendChild(getTemplate('main').content.cloneNode(true));

        const form = main.querySelector('form');

        const data = bindDataToInputs({
            firstname: String,
            lastname: String,
            sex: Number,
            birthdate: Date,
            address: String,
            tel: String
        }, form.elements);

        disableElements(form.elements, true);

        try {
            let res = await GET('/userinfo/retrieve');

            let userinfo = await res.json();

            for (let n in userinfo) {
                data[n] = userinfo[n];
            }
        } catch (error) {
            return;
        }

        disableElements(form.elements, false);

        form.addEventListener('submit', async function (ev) {
            ev.preventDefault();
            disableElements(form.elements, true);

            try {
                const res = await POST('userinfo/save', data);

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