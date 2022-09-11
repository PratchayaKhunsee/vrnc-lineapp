(() => {
    authenticate(new URLSearchParams({
        'redirect': `/vaccination/history`,
    }).toString()).then(x => {
        onrendered();
    });

    async function onrendered() {

        const main = getTemplate('main').content.cloneNode(true);
        const listItem = getTemplate('list-item');

        try {
            let res = await GET('/vaccination/list');
            let vaccination = await res.json();
            /** @type {HTMLDivElement} */
            let firstChild;

            for (let o of main.childNodes) {
                if (o instanceof HTMLDivElement) {
                    firstChild = o;
                    break;
                }
            }

            for (let n of vaccination) {
                let item = listItem.content.cloneNode(true);
                let id = typeof n.key == 'string' ? n.key : n.id;
                let values = n.value !== null && typeof n.value == 'object' ? n.value : n;
                /** @type {HTMLDetailsElement} */
                let details;

                for (let o of item.childNodes) {
                    if (o instanceof HTMLElement) {
                        details = o.querySelector('details');
                        break;
                    }
                }

                let vaccination_date = new Date(values.vaccination_date);

                details.querySelector('a').href = '/vaccination?id=' + id;
                details.querySelector('[name=vaccine_name]').appendChild(new Text(values.vaccine_name || '<ไม่ระบุ>'));
                details.querySelector('[name=vaccine_brand]').appendChild(new Text(values.vaccine_brand || '-'));
                details.querySelector('[name=vaccination_date]').appendChild(new Text(isNaN(vaccination_date.getTime()) ? '-' : vaccination_date.toLocaleDateString()));
                details.querySelector('[name=vaccination_address]').appendChild(new Text(values.vaccination_address || '-'));

                firstChild.appendChild(item);
            }

            document.querySelector('main').appendChild(main);
        } catch (error) {
            console.error(error);
        }
    }
})();