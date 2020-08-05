beforeEach(function () {
    var store = {
        'oauth2-test-params': {
            'access_token': 'fake-access-token'
        },
        'domain': 'fake-domain'
    };

    spyOn(localStorage, 'getItem').and.callFake(function (key) {
        return store[key];
    });

    loadFixtures('test-user.html');
    loadFixtures('test-group.html');
});
