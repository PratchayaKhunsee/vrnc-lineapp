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

            for(let o of main.childNodes){
                if(o instanceof HTMLDivElement){
                    firstChild = o;
                    break;
                }
            }

            for (let n of vaccination) {
                let item = listItem.content.cloneNode(true);
                console.log(vaccination);

                firstChild.appendChild(item);
                
                // main.childNodes.item.appendChild(item);
            }

            document.querySelector('main').appendChild(main);
        } catch (error) {
            return;
        }
    }
})();