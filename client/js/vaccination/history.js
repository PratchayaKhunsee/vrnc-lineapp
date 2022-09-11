(() => {
    authenticate(new URLSearchParams({
        'redirect': `/vaccination/history`,
    }).toString()).then(x => {
        onrendered();
    });

    async function onrendered() {

        const main = getTemplate('main').content.cloneNode(true);
        const listItem = getTemplate('list-item');

        document.querySelector('main').appendChild(main);

        try {
            let res = await GET('/vaccination/list');
            let vaccination = await res.json();

            for (let n of vaccination) {
                let item = listItem.content.cloneNode(true);
                console.log({item});
                main.firstChild.appendChild(item);
            }
        } catch (error) {
            return;
        }
    }
})();