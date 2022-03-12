(() => {
    authenticate(new URLSearchParams({
        'redirect': `/vaccination/create`,
    }).toString()).then(async () => {
        try {
            let res = await GET('/vaccination/create/confirm');
            let params = new URLSearchParams(await res.text());

            if (params.has('redirect')) location.assign(params.get('redirect'));
        } catch (error) {

        }
    });
})();