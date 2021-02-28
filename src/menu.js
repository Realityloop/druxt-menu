import { DruxtClient } from 'druxt'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

/**
 * DruxtMenu class.
 *
 * Provides methods for accessing Menu items from Drupal JSON:API.
 */
class DruxtMenu {
  /**
   * DruxtMenu constructor.
   *
   * - Validates module options.
   * - Sets up a DruxtRouter instance.
   *
   * @example @lang js
   * const druxtMenu = new DruxtMenu('https://example.com', {})
   *
   * @param {string} baseUrl - The URL of the Drupal backend.
   * @param {ModuleOptions} options - The module options.
   */
  constructor (baseUrl, options = {}) {
    // Check for URL.
    if (!baseUrl) {
      throw new Error('The \'baseUrl\' parameter is required.')
    }

    if ((options.menu || {}).jsonApiMenuItems) {
      options.menu.type = 'jsonapi_menu_items'
    }

    this.options = {
      menu: {
        type: 'menu_link_content'
      },
      ...options
    }

    /**
     * Instance of the Druxt Client.
     *
     * @type {DruxtClient}
     * @see {@link http://druxtjs.org/api/client}
     */
    this.druxt = new DruxtClient(baseUrl, options)
  }

  /**
   * Gets the menu items JSON:API resources using the configured method.
   *
   * @example @lang js
   * const menu = await druxtMenu.get('main')
   *
   * @param {string} menuName - The menu name.
   */
  async get(menuName) {
    switch (this.options.menu.type) {
      case 'decoupled_menus':
        return this.getDecoupledMenu(menuName)

      case 'jsonapi_menu_items':
        return this.getJsonApiMenuItems(menuName)

      default:
        return this.getMenuLinkContent(menuName)
    }
  }

  /**
   * Gets a menus 'menu_link_content' JSON:API resources.
   *
   * - This method can only retrieve user created menu items.
   * - This is the default method for the `get()` method.
   *
   * @example @lang js
   * const menu = await druxtMenu.getMenuLinkContent('menu')
   *
   * @param {string} menuName - The menu name.
   */
  async getMenuLinkContent(menuName) {
    const resource = 'menu_link_content--menu_link_content'
    const fields = ['bundle', 'description', 'link', 'menu_name', 'parent', 'title', 'weight']

    const query = new DrupalJsonApiParams()
      .addFilter('enabled', '1')
      .addFilter('menu_name', menuName)
      .addFields(resource, fields)

    const entities = []
    const collections = await this.druxt.getCollectionAll(resource, query)
    for (const collection of collections) {
      for (const entity of collection.data) {
        entities.push(entity)
      }
    }

    return { entities }
  }

  /**
   * Gets menu items via the Drupal JSON:API Menu Items module.
   *
   * - This method gets all menu items, but requires the JSON:API Menu Items module.
   * - This method is used by the `get()` method when the `jsonApiMenuItems` option is set.
   *
   * @see {@link https://www.drupal.org/project/jsonapi_menu_items|JSON:API Menu Items}
   *
   * @param {string} menuName - The menu name.
   */
  async getJsonApiMenuItems(menuName) {
    const resource = `menu_items--${menuName}`

    // Add the JSON API Menu items resource to the index.
    await this.druxt.getIndex()
    this.druxt.index[resource] = { href: `${this.druxt.options.endpoint}/menu_items/${menuName}` }

    const query = new DrupalJsonApiParams()
      .addFilter('enabled', '1')
      .addFilter('menu_name', menuName)

    const entities = []
    const collections = await this.druxt.getCollectionAll(resource, query)
    for (const collection of collections) {
      for (const resource of collection.data) {
        entities.push({
          id: resource.id,
          attributes: {
            description: resource.attributes.description,
            link: {
              uri: `internal:${resource.attributes.url}`
            },
            menu_name: menuName,
            parent: resource.attributes.parent.length ? resource.attributes.parent : null,
            title: resource.attributes.title,
            weight: resource.attributes.weight,
          },
          resource
        })
      }
    }

    return { entities }
  }

  /**
   * Gets menu items via the Drupal Decoupled Menus module.
   *
   * - This method is currently experimental.
   *
   * @example @lang js
   * const menu = await druxtMenu.getDecoupledMenu('menu')
   *
   * @param {string} menuName - The menu name.
   */
  async getDecoupledMenu(menuName) {
    const response = await this.druxt.axios.get(`/system/menu/${menuName}/linkset`)
    const linkset = (response.data || {}).linkset || []

    const entities = []
    for (const links of linkset) {
      for (const link of links.item) {
        const hierarchy = link['drupal-menu'][0].hierarchy
        const parent = hierarchy.slice(0, hierarchy.lastIndexOf('.')) || null

        entities.push({
          id: `${menuName}${hierarchy}`,
          attributes: {
            description: null,
            link: {
              // @todo Check for link type.
              uri: `internal:${link.href}`,
            },
            menu_name: menuName,
            parent: parent ? `${menuName}${parent}` : null,
            title: link.title,
            weight: hierarchy,
          }
        })
      }
    }

    return { entities }
  }
}

export { DruxtMenu }

/**
 * Module options.
 *
 * @typedef {object} ModuleOptions
 *
 * @see {@link ./typedefs/moduleOptions.html|ModuleOptions}
 */
