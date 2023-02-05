(() => {
    authenticate(new URLSearchParams({
        'redirect': `/vaccination/create`,
    }).toString()).then(async () => {
        try {
            const res = await GET('/vaccination/create/confirm');
            const params = new URLSearchParams(await res.text());

            if (params.has('redirect')) location.assign(params.get('redirect'));
        } catch (error) {

        }
    });
})();