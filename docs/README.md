---
home: true
heroImage: ./logo.svg
actionText: Get started
actionLink: /guide/getting-started
---

> The DruxtJS Menu module adds support for [Drupal](https://drupal.org) Menus to your [Nuxt.js](https://nuxtjs.org) frontend.


## The DruxtMenu component

Druxt Menu provides a Vue.js component to render a Drupal Menu.

```vue
<DruxtMenu :name="menuName" />
```

Get started with the [Guide](guide/) and [API Documentation](/api/components/DruxtMenu.html).


### Druxt component

The DruxtEntity component is compatible with the DruxtJS component theming system:

```vue
<Druxt module="menu" :props-data="{ name }" :wrapper="wrapper">
```

See the [Druxt component documentation](https://druxtjs.org/guide/#the-druxt-component) for more information.


## DruxtJS

DruxtJS is a suite of modules to connect a [Drupal](https://drupal.org) JSON:API backend to a [NuxtJS](https://nuxtjs.org) frontend.

Find out more at [https://druxtjs.org](https://druxtjs.org)