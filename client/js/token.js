(() => {
    let url = new URL(location.toString());
    fetch('/token/get', {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-from-urlencoded'
        },
        body: url.searchParams.toString(),
    }).then(async res => {
        let text = await res.text();
        let splited = text.split(' ');
        if (splited.length == 2) {
            localStorage.setItem('authorization', splited[1]);
            location.assign(url.searchParams.get('redirect'));
        }
    });
})();