"use strict";

const {host} = require('./config');
const ExpectAction = require('./expect-action');

// https://github.com/Automattic/expect.js
const expect = require('expect.js');

// require('natty-db')已被`webpack`映射到全局`NattyDB`对象
const NattyDB = require('natty-db');

let VERSION;
__BUILD_VERSION__

describe('NattyDB v' + VERSION + ' Unit Test', function() {

    describe('static',function() {
        it('version v' + VERSION, function() {
            expect(NattyDB.version).to.equal(VERSION);
        });
    });

    describe('global setting',function() {
        let defaultGlobalConfig = NattyDB.getGlobal();
        let defaultGlobalConfigProperties = [
            'data',
            'fit',
            'header',
            'ignoreSelfConcurrent',
            'jsonp',
            'log',
            'method',
            'mock',
            'mockUrl',
            'mockUrlPrefix',
            //'once',
            'process',
            'retry',
            'timeout',
            'url',
            'urlPrefix',
            'withCredentials',
            'traditional'
        ];

        let emptyEvent = NattyDB._event;

        let resetNattyDBGlobalConfig = function () {
            NattyDB.setGlobal(defaultGlobalConfig);
        };

        beforeEach(function () {
            resetNattyDBGlobalConfig();
        });

        afterEach(function () {
            // 清理所有事件
            let i;
            for (i in NattyDB._event) {
                if (i.indexOf('__') === 0) {
                    delete NattyDB._event[i];
                }
            }
        });

        it('check default global config properties: `NattyDB.getGlobal()`',function() {
            defaultGlobalConfigProperties.forEach(function (property) {
                expect(defaultGlobalConfig).to.have.key(property);
            });
        });

        it('check `NattyDB.getGlobal("property")`', function () {
            expect(NattyDB.getGlobal('jsonp')).to.be(false);
        });

        it('check `NattyDB.setGlobal(obj)`', function () {
            NattyDB.setGlobal({
                data: {
                    '_csrf_token': 1
                }
            });
            expect(NattyDB.getGlobal('data')).to.eql({
                '_csrf_token': 1
            });
            // 还原
            NattyDB.setGlobal({data: {}});
        });

        it('Context instance would inherit and extend the global config', function () {
            let urlPrefix = 'http://test.com/api';
            let DBC = new NattyDB.Context({
                urlPrefix: urlPrefix
            });

            // 继承了所有的全局配置
            defaultGlobalConfigProperties.forEach(function (property) {
                expect(DBC.config).to.have.key(property);
            });
            // 也扩展了全局配置
            expect(DBC.config.urlPrefix).to.be(urlPrefix);
        });

        it('Context instance would inherit and extend the global config', function () {
            let urlPrefix = 'http://test.com/api';
            NattyDB.setGlobal({
                urlPrefix: urlPrefix
            });

            let DBC = new NattyDB.Context();
            let Order = DBC.create('Order', {
                create: {}
            });
            expect(Order.create.config.urlPrefix).to.be(urlPrefix);
        });

        it('check global `error`', function (done) {
            NattyDB.setGlobal({
                urlPrefix: host
            });

            // 下面的js错误应该被捕获到
            NattyDB.on('error', function (error) {
                try {
                    expect(window.notExistedFn).to.be(undefined);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });


            let DBC = new NattyDB.Context();
            let Order = DBC.create('Order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            Order.create().then(function(data) {
                // 触发一个js错误
                notExistedFn();
            }, function () {});
        });

        it('check global `resolve`', function (done) {
            NattyDB.setGlobal({
                urlPrefix: host
            });

            NattyDB.on('resolve', function (data, config) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });


            let DBC = new NattyDB.Context();
            let Order = DBC.create('Order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            Order.create().then(function(data) {}, function () {});
        });

        it('check global `reject`', function (done) {
            NattyDB.setGlobal({
                urlPrefix: host
            });

            NattyDB.on('reject', function (error, config) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });

            let DBC = new NattyDB.Context();
            let Order = DBC.create('Order', {
                create: {
                    url: 'api/return-error',
                    method: 'POST'
                }
            });
            Order.create().then(function(data) {}, function () {});
        });

        it('check context `resolve`', function (done) {
            let DBC = new NattyDB.Context({
                urlPrefix: host
            });

            DBC.on('resolve', function (data, config) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });

            let Order = DBC.create('Order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            Order.create().then(function(data) {}, function () {});
        });

        it('check context `reject`', function (done) {
            let DBC = new NattyDB.Context({
                urlPrefix: host
            });

            DBC.on('reject', function (error, config) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });

            let Order = DBC.create('Order', {
                create: {
                    url: 'api/return-error',
                    method: 'POST'
                }
            });
            Order.create().then(function(data) {}, function () {});
        });

        it('check both global and context `resolve`', function (done) {
            let globalResolve = false;
            NattyDB.setGlobal({
                urlPrefix: host
            });

            NattyDB.on('resolve', function (content) {
                //console.log(1, content);
                globalResolve = true;
            });

            let DBC = new NattyDB.Context({
            });

            DBC.on('resolve', function (content) {
                //console.log(2, content);
                try {
                    expect(globalResolve).to.be(true);
                    expect(content.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });

            let Order = DBC.create('Order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            Order.create().then(function(data) {}, function () {});
        });

        it('check both global and context `reject`', function (done) {
            let globalReject = false;
            NattyDB.setGlobal({
                urlPrefix: host
            });

            NattyDB.on('reject', function (error) {
                //console.log(1, error);
                globalReject = true;
            });


            let DBC = new NattyDB.Context({
                urlPrefix: host
            });

            DBC.on('reject', function (error, config) {
                //console.log(2, error);
                try {
                    expect(globalReject).to.be(true);
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });

            let Order = DBC.create('Order', {
                create: {
                    url: 'api/return-error',
                    method: 'POST'
                }
            });
            Order.create().then(function(data) {}, function () {});
        });

        //it('`blacklist` for global options', function () {
        //    // 在全局的配置上声明了全局配置 不应该被接口配置继承
        //    NattyDB.setGlobal({
        //        reject: function(){},
        //        resolve: function(){}
        //    });
        //    let DBC = new NattyDB.Context();
        //    // 在接口的配置上声明了全局配置 不应该生效
        //    let Order = DBC.create('Order', {
        //        pay: {}
        //    });
        //
        //    expect(Order.pay.config).not.to.have.keys(['reject', 'resolve']);
        //});

    });

    describe('api config', function () {

        let DBC;

        beforeEach('reset NattyDB context', function () {
            DBC = new NattyDB.Context({
                urlPrefix: host,
                jsonp: true,
                mock: false
            });
        });

        it('both object and function can be used as api\'s config', function () {
            let Order = DBC.create('Order', {
                // api 对应 配置
                pay: {},
                // api 对应 返回配置的函数
                create: function () {
                    return {}
                }
            });

            expect(Order).to.be.a('object');
            expect(Order.pay).to.be.a('function');
            expect(Order.create).to.be.a('function');
        });

        it('`mock` option', function () {
            let Order = DBC.create('Order', {
                pay: {
                    mock: true
                },
                create: {
                    mock: false
                },
                close: {
                    // 此处mock的值等于context.mock
                }
            });

            expect(Order.pay.config.mock).to.be(true);
            expect(Order.create.config.mock).to.be(false);
            expect(Order.close.config.mock).to.be(false);
        });

        it('`mock` and `method` option', function () {
            let Order = DBC.create('Order', {
                pay: {
                    mock: true,
                    method: 'POST' // 当`mock`为`true`时 `method`的配置会被纠正到`GET`
                }
            });

            expect(Order.pay.config.method).to.be('GET');
        });

        it('`mock` value from global', function () {
            let DBCWithoutMock  = new NattyDB.Context();
            let Order = DBCWithoutMock.create('Order', {
                pay: {
                    // 这个mock等于全局mock值
                }
            });

            expect(Order.pay.config.mock).to.be(false);
        });

        //it('`blacklist` for API options', function () {
        //    let DBC  = new NattyDB.Context();
        //    // 在接口的配置上声明了全局配置 不应该生效
        //    let Order = DBC.create('Order', {
        //        pay: {
        //            reject: function(){},
        //            resolve: function(){}
        //        }
        //    });
        //
        //    expect(Order.pay.config).not.to.have.keys(['reject', 'resolve']);
        //});
        //
        //it('`blacklist` for Context options', function () {
        //    // 在上下文的配置上声明了全局配置 不应该被接口配置继承
        //    let DBC  = new NattyDB.Context({
        //        reject: function(){},
        //        resolve: function(){}
        //    });
        //    // 在接口的配置上声明了全局配置 不应该生效
        //    let Order = DBC.create('Order', {
        //        pay: {}
        //    });
        //
        //    expect(Order.pay.config).not.to.have.keys(['reject', 'resolve']);
        //});






        it('`mockUrlPrefix` value from context', function () {
            let DBC  = new NattyDB.Context({
                // NOTE 当`mock`为true时, 才会处理`mockUrl`的值
                mock: true,
                mockUrlPrefix: './mock/'
            });
            let Order = DBC.create('Order', {
                pay: {
                    mockUrl: 'pay'
                },
                create: {
                    mockUrl: '../create'
                },
                close: {
                    mockUrl: 'https://www.demo.com/close'
                }
            });

            expect(Order.pay.config.mockUrl).to.be('./mock/pay');
            expect(Order.create.config.mockUrl).to.be('../create');
            expect(Order.close.config.mockUrl).to.be('https://www.demo.com/close');
        });

        it('`jsonp` option', () => {
            let Order = DBC.create('Order', {
                pay: {
                    url: 'path'
                },
                transfer: {
                    jsonp: false,
                    url: 'path'
                },
                create: {
                    url: 'path.jsonp'
                },
                close: {
                    url: 'path.jsonp?foo'
                },
                delay: {
                    mock: true,
                    mockUrl: 'foo',
                    jsonp: false, // mock为true时, jsonp的值不会根据url的值自动纠正
                    url: 'path.jsonp?foo'
                }
            });

            expect(Order.pay.config.jsonp).to.be(true);
            expect(Order.transfer.config.jsonp).to.be(false);
            expect(Order.create.config.jsonp).to.be(true);
            expect(Order.close.config.jsonp).to.be(true);
            expect(Order.delay.config.jsonp).to.be(false);
        });

        it('auto `urlPrefix`', function () {
            let Order = DBC.create('Order', {
                method1: {
                    url: 'path'
                },
                method2: {
                    url: '//foo.com/path'
                },
                method3: {
                    url: 'http://foo.com/path'
                },
                method4: {
                    url: 'https://foo.com/path'
                },
                method5: {
                    url: './path'
                },
                method6: {
                    url: '../path'
                },
                method7: {
                    url: '/path'
                }
            });

            expect(Order.method1.config.url).to.equal(host + 'path');
            expect(Order.method2.config.url).to.be('//foo.com/path');
            expect(Order.method3.config.url).to.be('http://foo.com/path');
            expect(Order.method4.config.url).to.be('https://foo.com/path');
            expect(Order.method5.config.url).to.be('./path');
            expect(Order.method6.config.url).to.be('../path');
            expect(Order.method7.config.url).to.be('/path');
        });
    });

    describe('request config', function () {
        //this.timeout(1000*60);
        let DBC;

        beforeEach('reset', function () {
            DBC = new NattyDB.Context();
        });
        // 当使用request参数时, 只有data, retry, ignoreSelfConcurrent起作用
        it('`request` config with success', function (done) {
            let getPayId = (successFn) => {
                setTimeout(function () {
                    successFn({id: 1});
                }, 200);
            };
            let Order = DBC.create('Order', {
                getSign: {
                    data: {
                        a: 1
                    },
                    request: function (vars, config, defer) {
                        // 验证参数是否正确合并
                        expect(vars.data.a).to.be(1);
                        expect(vars.data.b).to.be(1);
                        getPayId(function (content) {
                            defer.resolve(content);
                        });
                    }
                }
            });

            Order.getSign({
                b: 1
            }).then(function (content) {
                expect(content.id).to.be(1);
                done();
            });
        });

        it('`request` config with error', function (done) {
            let getPayId = (successFn, errorFn) => {
                setTimeout(function () {
                    errorFn({message: 1});
                }, 200);
            };
            let Order = DBC.create('Order', {
                getSign: {
                    request: function (data, config, defer, retryTime) {
                        getPayId(function (content) {
                            defer.resolve(content);
                        }, function (error) {
                            defer.reject(error);
                        });
                    }
                }
            });

            Order.getSign().then(function (content) {
            }, function (error) {
                expect(error.message).to.be(1);
                done();
            });
        });

        it('`request` config with retry', function (done) {
            let getPayId = (successFn, errorFn) => {
                setTimeout(function () {
                    errorFn({message: 1});
                }, 200);
            };
            let Order = DBC.create('Order', {
                getSign: {
                    retry: 1,
                    request: function (data, config, defer, retryTime) {
                        //console.log(retryTime);

                        getPayId(function (content) {
                            defer.resolve(content);
                        }, function (error) {
                            defer.reject(error);
                        });
                    }
                }
            });

            Order.getSign().then(function (content) {
            }, function (error) {
                expect(error.message).to.be(1);
                done();
            });
        });

        it('`request` config with ignoreSelfConcurrent', function (done) {
            let count = 0;
            let getPayId = (successFn, errorFn) => {
                count++;
                setTimeout(function () {
                    errorFn({message:1});
                }, 200);
            };

            let Order = DBC.create('Order', {
                getSign: {
                    ignoreSelfConcurrent: true,
                    request: function (data, config, defer, retryTime) {
                        //console.log(retryTime);

                        getPayId(function (content) {
                            defer.resolve(content);
                        }, function (error) {
                            defer.reject(error);
                        });
                    }
                }
            });

            Order.getSign().then(function (content) {
            }, function (error) {
                expect(error.message).to.be(1);
            });

            Order.getSign().then(function (content) {
            }, function (error) {
            });

            setTimeout(function () {
                expect(count).to.be(1);
                done();
            }, 1000);
        });
    });

    describe("DBC.create", function () {
        let DBC = new NattyDB.Context();

        it('structure for DBC', function () {
            DBC.create('Order', {
                create: {}
            });

            DBC.create('User', {
                getPhone: {}
            });
            expect(DBC).to.have.keys(['Order', 'User', 'config']);
        });

        it('create existed DB should throw error', function () {
            // crete相同的DB
            let createExistedDB = function () {
                DBC.create('Order', {
                    create: {}
                })
            };
            expect(createExistedDB).to.throwError();
        });
    });

    describe('ajax', function() {
        // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
        //NattyDB.setGlobal({
        //    cache: false,
        //    traditional: true
        //});

        this.timeout(1000*60);
        let DBC;

        beforeEach('reset', function () {
            DBC = new NattyDB.Context({
                urlPrefix: host,
                mock: false
            });
        });

        it('play with standard data structure', function (done) {

            let Order = DBC.create('Order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST',
                    //traditional: true
                }
            });

            Order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it.skip('play with standard data structure with cookie', function (done) {

            let Order = DBC.create('Order', {
                create: {
                    url: 'api/return-cookie',
                    method: 'POST',
                    //traditional: true
                }
            });

            let cookieTime = new Date().getTime();
            cookie.set('cookieTime', cookieTime);

            Order.create().then(function(data) {
                try {
                    expect(data.cookieTime).to.be(cookieTime);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        //it('once', function (done) {
        //    let User = DBC.create('User', {
        //        getPhone: {
        //            url: 'api/once',
        //            once: true
        //        }
        //    });
        //
        //    User.getPhone().then(function(data) {
        //        try {
        //            expect(data.phone).to.be(1);
        //            done();
        //        } catch(e) {
        //            done(new Error(e.message));
        //        }
        //    });
        //
        //    setTimeout(function () {
        //        User.getPhone().then(function(data) {
        //            try {
        //                expect(data.phone).to.be(1);
        //                done();
        //            } catch(e) {
        //                done(new Error(e.message));
        //            }
        //        });
        //    }, 1000);
        //});

        it('play with non-standard data structure by `fit`', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create-non-standard',
                    method: 'POST',
                    fit: function (response) {
                        return {
                            success: !response.hasError,
                            content: response.content
                        };
                    }
                }
            });
            Order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('process data', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create',
                    method: 'POST',
                    process: function (response) {
                        return {
                            orderId: response.id
                        };
                    }
                }
            });
            Order.create().then(function(data) {
                try {
                    expect(data.orderId).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        // 固定参数和动态参数 在process和fix方法中都可以正确获取到
        it('`vars.data` in process or fix method', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create',
                    method: 'POST',
                    data: {
                        fixData: 1
                    },
                    process: function (content, vars) {
                        expect(vars.data.fixData).to.be(1);
                        expect(vars.data.liveData).to.be(1);
                        return {
                            orderId: content.id
                        };
                    },
                    fit: function (response, vars) {
                        expect(vars.data.fixData).to.be(1);
                        expect(vars.data.liveData).to.be(1);
                        return response;
                    }
                }
            });

            Order.create({
                liveData: 1
            }).then(function(data) {
                try {
                    expect(data.orderId).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });


        it('skip process data when it is mocking ', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    mock: true,
                    mockUrl: host + 'api/order-create',
                    process: function (response) {
                        if (this.mock) {
                            return response;
                        } else {
                            return {
                                orderId: response.id
                            };
                        }
                    }
                }
            });
            Order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('error by requesting cross-domain with disabled header [NOTE: IE的行已被标准化]', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/order-create',
                    method: 'POST',
                    header: {foo: 'foo'} // 跨域时, 自定义的`header`将被忽略
                }
            });

            Order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(e.message);
                }
            }, function(error) {
                // can not go here
            });
        });

        it('error by timeout', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/timeout',
                    method: 'POST',
                    timeout: 100
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.timeout).to.be(true);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('pending status checking', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/timeout',
                    method: 'POST',
                    timeout: 200
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(Order.create.config.pending).to.be(false);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
            expect(Order.create.config.pending).to.be(true);
        });

        it('error by 500', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/500',
                    method: 'POST'
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.status).to.be(NattyDB.ajax.fallback ? undefined : 500);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('error by 404', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/404',
                    method: 'POST'
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.status).to.be(NattyDB.ajax.fallback ? undefined : 404);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('`GET` resolving after retry', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/retry-success',
                    method: 'GET',
                    retry: 2
                }
            });

            Order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            }, function() {
                // can not go here
            });
        });

        it('`POST` resolving after retry', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/retry-success',
                    method: 'POST',
                    retry: 2
                }
            });

            Order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            }, function() {
                // can not go here
            });
        });

        it('rejecting after retry', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/return-error',
                    retry: 1
                }
            });
            Order.create().then(function (data) {
                // can not go here
            }, function(error) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        // 连发两次请求，第二次应该被忽略
        it('ignore seft concurrent', function (done) {

            let Order = DBC.create('Order', {
                create: {
                    cache: false,
                    url: host + 'api/timeout', // 请求延迟返回的接口
                    ignoreSelfConcurrent: true
                }
            });

            Order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });

            // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
            let dummyPromise = Order.create().then(function(){
                throw new Error('unexpected `resolved`');
            });
            expect(dummyPromise).to.have.property('dummy');

            // 伪造的promise对象要保证支持链式调用
            expect(dummyPromise.then()).to.be(dummyPromise);
            expect(dummyPromise.then().catch()).to.be(dummyPromise);
            expect(dummyPromise.then().catch().finally()).to.be(dummyPromise);
        });

        // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有返回, 则取消掉第一次请求(即: 返回时不响应)
        it('override seft concurrent(XHR)', function (done) {

            let Order = DBC.create('Order', {
                create: {
                    cache: false,
                    url: host + 'api/timeout', // 请求延迟返回的接口
                    overrideSelfConcurrent: true,
                    process: function(content, vars) {
                        // vars不应该混淆
                        expect(vars.data.d).to.be(2);
                    }
                }
            });

            let count = 0;

            // 第一次请求, 不应该有响应
            Order.create({
                d: 1
            }).then(function (data) {
                count++
            });

            // 第二次请求, 只响应这次请求
            setTimeout(function(){
                Order.create({
                    d:2
                }).then(function (data) {
                    try {
                        expect(count).to.be(0);
                        done();
                    } catch (e) {
                        done(new Error(e.message));
                    }
                });
            }, 300);
        });

        // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有响应, 则取消掉第一次请求(的响应)
        it('override seft concurrent(JSONP)', function (done) {

            let Order = DBC.create('Order', {
                create: {
                    cache: false,
                    jsonp: true,
                    url: host + 'api/jsonp-timeout', // 请求延迟返回的接口
                    overrideSelfConcurrent: true,
                    process: function(content, vars) {
                        // vars不应该混淆
                        expect(vars.data.d).to.be(2);
                    }
                }
            });

            let count = 0;

            // 第一次请求, 不应该有响应
            Order.create({
                d: 1
            }).then(function (data) {
                count++
            });

            // 第二次请求, 只响应这次请求
            setTimeout(function(){
                Order.create({
                    d:2
                }).then(function (data) {
                    try {
                        expect(count).to.be(0);
                        done();
                    } catch (e) {
                        done(new Error(e.message));
                    }
                });
            }, 300);
        });

        it('loop', function (done) {
            let Taxi = DBC.create('Taxi', {
                getDriverNum: {
                    url: host + 'api/return-success'
                }
            });

            let time = 0;

            // 开始轮询
            Taxi.getDriverNum.startLoop({
                data: {},
                duration: 200
            }, function (data) {
                // 成功回掉
                time++;
            }, function (error) {
                // 失败回调
            });

            setTimeout(function () {
                expect(time).to.be.above(1);
                // 验证状态
                expect(Taxi.getDriverNum.looping).to.be(true);
                // 停止轮询
                Taxi.getDriverNum.stopLoop();
                // 验证状态
                expect(Taxi.getDriverNum.looping).to.be(false);
                done();
            }, 1000);
        });
    });


    describe('jsonp', function () {
        // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
        //NattyDB.setGlobal({
        //    cache: false
        //});

        this.timeout(1000*60);
        let DBC;

        beforeEach('reset', function () {
            DBC = new NattyDB.Context({
                urlPrefix: host,
                mock: false
            });
        });

        it('check default jsonpCallbackQuery', function () {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create',
                    jsonp: true
                }
            });

            expect(Order.create.config.jsonpCallbackQuery).to.be(undefined);
        });

        it('check custom jsonpCallbackQuery', function () {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create',
                    jsonp: [true, 'cb', 'j{id}']
                }
            });

            expect(Order.create.config.jsonp).to.be(true);
            expect(Order.create.config.jsonpFlag).to.be('cb');
            expect(Order.create.config.jsonpCallbackName).to.be('j{id}');
        });

        it('auto detect jsonp option', function () {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/order-create.jsonp'
                }
            });

            expect(Order.create.config.jsonp).to.be(true);
        });

        it('jsonp response.success is true', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    traditional: true,
                    data: {
                        a: [1,2,3]
                    },
                    //log: true,
                    url: host + 'api/jsonp-order-create',
                    jsonp: true
                }
            });

            Order.create().then(function (data) {

                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });
        });

        it('jsonp response.success is false ', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/jsonp-order-create-error',
                    jsonp: true
                }
            });

            Order.create().then(function (data) {
                // can not go here
            }, function (error) {
                try {
                    expect(error).to.have.property('message');
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });
        });

        // jsonp无法使用状态吗识别出具体的404、500等错误，都统一成`无法连接`的错误信息
        it('jsonp with error url', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'error-url',
                    jsonp: true
                }
            });

            Order.create().then(function (data) {
                // can not go here
            }, function (error) {
                try {
                    expect(error.message).to.contain('Not Accessable JSONP');
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });
        });

        it('jsonp timeout', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    //log: true,
                    url: host + 'api/jsonp-timeout',
                    jsonp: true,
                    timeout: 300
                }
            });
            Order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.timeout).to.be(true);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('`JSONP` resolving after retry', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/jsonp-retry-success',
                    jsonp: true,
                    retry: 2
                }
            });

            Order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            }, function() {
                // can not go here
            });
        });

        it('rejecting after retry', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/jsonp-error',
                    jsonp: true,
                    retry: 1
                }
            });
            Order.create().then(function (data) {
                // can not go here
            }, function(error) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(new Error(e.message));
                }
            });
        });

        it('ignore self concurrent', function (done) {
            let Order = DBC.create('Order', {
                create: {
                    url: host + 'api/jsonp-timeout', // 请求延迟返回的接口
                    jsonp: true,
                    ignoreSelfConcurrent: true
                }
            });

            // 连发两次请求，第二次应该被忽略
            Order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(new Error(e.message));
                }
            });

            // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
            let dummyPromise = Order.create();
            expect(dummyPromise).to.have.property('dummy');

            // 伪造的promise对象要保证支持链式调用
            expect(dummyPromise.then()).to.be(dummyPromise);
            expect(dummyPromise.then().catch()).to.be(dummyPromise);
            expect(dummyPromise.then().catch().finally()).to.be(dummyPromise);
        });
    });

});
