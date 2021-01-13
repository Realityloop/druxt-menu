import { DruxtRouter } from 'druxt-router'
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
   * @param {string} baseURL - The URL of the Drupal backend.
   * @param {ModuleOptions} options - The module options.
   */
  constructor (baseURL, options = {}) {
    // Check for URL.
    if (!baseURL) {
      throw new Error('The \'baseURL\' parameter is required.')
    }

    this.options = {
      endpoint: '/jsonapi',
      menu: {
        jsonApiMenuItems: false
      },

      ...options
    }

    // Setup Druxt Router.
    this.druxtRouter = new DruxtRouter(baseURL, options)
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
    if (this.options.menu.jsonApiMenuItems) {
      return this.getJsonApiMenuItems(menuName)
    }

    return this.getMenuLinkContent(menuName)
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

    const entities = await this.druxtRouter.getResources(resource, query, { all: true })

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
    await this.druxtRouter.getIndex()
    this.druxtRouter.index[resource] = { href: `${this.options.endpoint}/menu_items/${menuName}` }

    const query = new DrupalJsonApiParams()
      .addFilter('enabled', '1')
      .addFilter('menu_name', menuName)

    const resources = await this.druxtRouter.getResources(resource, query, { all: true })

    const entities = resources.map(resource => {
      const entity = {
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
      }
      return entity
    })

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