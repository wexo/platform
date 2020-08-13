import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import 'src/module/sw-product/component/sw-product-variants/sw-product-variants-overview';

function createWrapper(privileges = []) {
    const localVue = createLocalVue();
    localVue.use(Vuex);
    localVue.directive('tooltip', {});

    return shallowMount(Shopware.Component.build('sw-product-variants-overview'), {
        localVue,
        propsData: {
            selectedGroups: []
        },
        mocks: {
            $tc: () => {},
            $router: {
                replace: () => {}
            },
            $route: {
                query: {}
            },
            $store: new Vuex.Store({
                modules: {
                    swProductDetail: {
                        namespaced: true,
                        state() {
                            return {
                                currencies: []
                            };
                        },
                        getters: {
                            isLoading: () => false
                        }
                    }
                }
            })
        },
        provide: {
            repositoryFactory: {},
            acl: {
                can: (identifier) => {
                    if (!identifier) { return true; }

                    return privileges.includes(identifier);
                }
            }
        },
        stubs: {
            'sw-container': true,
            'sw-simple-search-field': true,
            'sw-button': true,
            'sw-icon': true,
            'sw-context-menu': true,
            'sw-tree': true,
            'sw-data-grid': true,
            'sw-pagination': true
        }
    });
}

describe('src/module/sw-product/component/sw-product-variants/sw-product-variants-overview', () => {
    beforeAll(() => {
        const product = {
            media: []
        };
        product.getEntityName = () => 'T-Shirt';

        Shopware.State.registerModule('swProductDetail', {
            namespaced: true,
            state: {
                product: product,
                currencies: []
            }
        });
    });

    it('should be a Vue.JS component', () => {
        const wrapper = createWrapper();

        expect(wrapper.isVueInstance()).toBe(true);
    });

    it('should have an disabled generate variants button', () => {
        const wrapper = createWrapper();
        const generateVariantsButton = wrapper.find('.sw-product-variants__generate-action');

        expect(generateVariantsButton.exists()).toBeTruthy();
        expect(generateVariantsButton.attributes().disabled).toBeTruthy();
    });

    it('should have an enabled generate variants button', () => {
        const wrapper = createWrapper([
            'product.creator'
        ]);
        const generateVariantsButton = wrapper.find('.sw-product-variants__generate-action');

        expect(generateVariantsButton.exists()).toBeTruthy();
        expect(generateVariantsButton.attributes().disabled).toBeFalsy();
    });

    it('should allow inline editing', () => {
        const wrapper = createWrapper([
            'product.editor'
        ]);

        const dataGrid = wrapper.find('.sw-product-variants-overview__data-grid');
        expect(dataGrid.attributes().allowinlineedit).toBeTruthy();
    });

    it('should disallow inline editing', () => {
        const wrapper = createWrapper();

        const dataGrid = wrapper.find('.sw-product-variants-overview__data-grid');
        expect(dataGrid.attributes().allowinlineedit).toBeFalsy();
    });
});
