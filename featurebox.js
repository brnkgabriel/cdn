var Featurebox = (function (json) {

  var Database = (function (config) {
    var app = firebase.initializeApp(config)
    var firestore = app.firestore()

    function getDocument(collection, doc_ref) {
      return firestore.collection(collection).doc(doc_ref)
        .get().then((doc) => doc.exists ? doc.data() : {})
        .catch(util.unsuccessful.bind('From Firestore Fetch'))
    }

    function saveDocument(collection, doc_ref, data) {
      var ref = firestore.collection(collection).doc(doc_ref)
      return ref.set(data, { merge: true })
    }

    return { getDocument, saveDocument }
  })

  var util = (function () {
    var firestore = Database(json.config)
    var UPDATE_URL = 'update url'
    var UPDATE_UI = 'update ui'
    var PAGE = 'pagination query'
    var DEFAULT = 'default url query'
    var FILTER_UPDATED = 'filter updated'
    var COLLECTION = json.collection || 'marketing-initiatives'
    var PAGE_NAME = json.name || ''
    var PRODUCTS = 'fetch type products'
    var FILTERS = 'fetch type filters'
    var FETCHED_DATA = 'fetched data'
    var FREELINKS_BUILT = 'freelinks built'
    var FREELINK_NAME = json.freelink ? json.freelink : 'Userneed'
    var SKUS_PER_PAGE = 40
    var MAX_PAGE = 50
    var is_mobile = navigator.userAgent.toLowerCase().includes("mobi")
    var is_first_load = true
    var sku_details = {}
    var url_params = {
      brand: '',
      rating: '',
      price: '',
      discount: '',
      shop_premium_services: '',
      shipped_from: '',
      search: '',
      category: '',
      page: '',
      sort: '',
      tag: '',
      type: ''
    }
    var rem_content = [
      "Grocery/Beverages/Coffee, Tea & Cocoa/Coffee & Tea Gifts",
      "Health & Beauty/Health Care/Medications & Treatments",
      "Home & Office/Office Products/Packaging Materials",
      "Grocery/Lighters & Matches",
      "Grocery/Beverages/Coffee, Tea & Cocoa/Tea/Herbal",
      "Fashion/Men's Fashion/Clothing/Underwear",
      "Women's Fashion/Clothing/Lingerie, Sleep & Lounge",
      "Health & Beauty/Sexual Wellness",
      "Fashion/Women's Fashion/Underwear & Sleepwear",
      "Fashion/Women's Fashion/Maternity",
      "Fashion/Women's Fashion/Clothing/Swimsuits & Cover Ups",
      "Women's Fashion/Clothing/Socks & Hosiery",
      "Sporting Goods/Sports & Fitness/Exercise & Fitness",
      "Home & Office/Arts, Crafts & Sewing/Sewing/Sewing Notions & Supplies/Dress Forms & Mannequins/Mannequins",
      "Fashion/Women's Fashion/Clothing/Active/Active Underwear"
    ]
    var discounts = [
      { name: '50% or more', value: '50-100' },
      { name: '40% or more', value: '40-100' },
      { name: '30% or more', value: '30-100' },
      { name: '20% or more', value: '20-100' },
      { name: '10% or more', value: '10-100' }
    ]

    var ratings = [
      { name: 'rating-4', percent: '80%', value: '4-5' },
      { name: 'rating-3', percent: '60%', value: '3-5' },
      { name: 'rating-2', percent: '40%', value: '2-5' },
      { name: 'rating-1', percent: '20%', value: '1-5' }
    ]

    var WEEKDAY = { weekday: 'short' }
    var MONTH = { month: 'short' }
    function el(query) { return document.querySelector('#app ' + query) }
    function all(query) { return document.querySelectorAll('#app ' + query) }
    function dayMonth(json) { return json.date.toLocaleString('en-us', json.opt) }
    function id(name) { return name.split(' ').join('-').toLowerCase() }
    function skus(data) { return data }
    function brandToURL(brand) { return brand.split(' ').join('-').toLowerCase() }
    function percent(rating) { return ((rating / 5) * 100).toFixed(2) }
    function filters_url(json) { return json.host + '/catalog/filters/?return=' + json.url }

    function shippedFroms(country) {
      return [
        { name: 'Shipped from abroad', value: 'jumia_global', class_name: '-global' },
        { name: 'Shipped from ' + country, value: 'country_local', class_name: '-local' }
      ]
    }

    function unsuccessful(err) {
      console.trace()
      console.error(':( sorry try again', err.message)
    }

    function addAndRemove(to_add, to_remove, class_name) {
      to_add.forEach(el => el.classList.add(class_name))
      to_remove.forEach(el => el.classList.remove(class_name))
    }

    function url(json, domain) {
      var catalog = json.search !== '' ? domain.catalogSearch : domain.catalog 
      var category = json.category
      var brand = json.brand
      var link = catalog
      var search = json.search
      link += category !== '' ? `/${category}/` : ''
      link += brand !== '' ? `/${brand}/` : ''
      link += '?'
      link += search !== '' ? `q=${search}&` : ''

      var filters = Object.keys(json)
      .filter(key => json[key] !== '' && key !== 'category' && key !== 'brand' && key !== 'search')
      .map(key => `${key}=${json[key]}`).join('&')

      var url = link + filters
      console.log('final url', url)
      return url 
    }

    return { id, el, all, dayMonth, WEEKDAY, MONTH, UPDATE_URL, UPDATE_UI, FILTER_UPDATED, COLLECTION, SKUS_PER_PAGE, MAX_PAGE, FETCHED_DATA, FREELINK_NAME, url_params, skus, brandToURL, percent, rem_content, PAGE, DEFAULT, url, unsuccessful, discounts, shippedFroms, ratings, addAndRemove, is_mobile, filters_url, sku_details, PRODUCTS, FILTERS, is_first_load, firestore, PAGE_NAME, FREELINKS_BUILT }
  })()

  class PreProcess {
    constructor() {
      this.span = document.createElement('span')
      this.span.className = '-loading -posabs -preloader'
      addEventListener('load', this.cartSectionAdjustments.bind(this))
    }
    cartSectionAdjustments() {
      this.addPreloaderToHeaderMain()
      var actions = document.querySelector('.header-main>.actions')
      var cart = document.getElementById('cart')
      var account = document.getElementById('account')
      var help = document.getElementById('help')

      actions.innerHTML = ''
      actions.appendChild(account)
      actions.appendChild(help)
      actions.appendChild(cart)

      var search_bar = document.querySelector('.osh-search-bar')
      var search_btn = document.getElementById('header-search-submit')
      var search_fld = document.querySelector('.osh-search-bar>.field-panel')

      search_bar.innerHTML = ''
      search_bar.appendChild(search_fld)
      search_bar.appendChild(search_btn)

      var hello = document.querySelector('#account.osh-dropdown .label')
      var tc = hello.textContent
      hello.innerHTML = tc === 'Your' ? '<icon></icon><txt>Your</txt>' : '<icon></icon><txt>Hi,</txt>'

      var help_label = document.querySelector('#help.osh-dropdown .label')
      help_label.innerHTML = ''
      this.span.classList.remove('-loading')
      this.span.style.display = 'none'
    }

    addPreloaderToHeaderMain() {
      var header_main = document.querySelector('.osh-container.header-main')
      header_main.prepend(this.span)
    }
  }

  /** Publish & Subscribe. The broadcasting station of the program */
  var pubsub = (function () {
    var events = {}

    function subscribe(eventName, fn) {
      events[eventName] = events[eventName] || []
      events[eventName].push(fn)
    }

    function unsubscribe(eventName, fn) {
      if (events[eventName]) {
        var idx = events[eventName].findIndex(fxn => fxn === fn)
        events[eventName].splice(idx, 1)
      }
    }

    function emit(eventName, data) {
      if (events[eventName]) { events[eventName].forEach(fn => fn(data)) }
    }

    return { subscribe, unsubscribe, emit }
  })()

  /** Lazyloading of images */
  var ImageObserver = (function (parent) {
    var query_from = parent || document
    var images = query_from.querySelectorAll('.lazy-image')
    var preloaders = query_from.querySelectorAll('.-preloader')

    var entities = Array.from(images).concat(Array.from(preloaders))
    var observer = null

    try {
      observer = new IntersectionObserver(onIntersection.bind(this), {})
      entities.forEach(imageObserve)
    } catch (error) {
      entities.forEach(lazyLoad)
    }

    function imageObserve(entity) {
      observer.observe(entity)
    }

    function lazyLoad(entity) {
      if (entity.src !== undefined) {
        entity.src = entity.getAttribute('data-src')
        entity.onload = () => afterLoad(entity)
      } else afterLoad(entity)
    }

    function afterLoad(entity) {
      entity.classList.add('loaded')
      removeLoader(entity)
    }

    function removeLoader(entity) {
      entity.classList.remove('-loading')
      entity.classList.remove('-hide')
    }

    function onIntersection(image_entities) {
      image_entities.forEach(intersect)
    }

    function intersect(entity) {
      if (entity.isIntersecting) {
        observer.unobserve(entity.target)
        isImage(entity) ? imageIntersect(entity) : preloaderIntersect(entity)
      }
    }

    function isImage(entity) {
      return entity.target.dataset.src !== undefined
    }

    function imageIntersect(entity) {
      entity.target.src = entity.target.dataset.src
      entity.target.onload = () => afterLoad(entity.target)
    }

    function preloaderIntersect(entity) {
      removeLoader(entity.target)
    }
  })

  var BannersFreelinksTitle = (function (list) {
    var banner_parent = util.el('.-banner.-row')
    var frlink_parent = util.el('.-freelinks.-row')
    var title = util.el('.-featurebox-title')

    function init() {
      pubsub.subscribe(util.FETCHED_DATA, build)
    }

    function build(data) {
      buildBanner(data.config);
      buildTitle(data.config)
      buildFreelinks(data.json_list)

      shouldDisplayOrNot(data.config)
    }

    function shouldDisplayOrNot(config) {
      var should_display_banner = config['display_double_banner_' + util.PAGE_NAME] || config['display_double_banner']
      should_display_banner === 'no' && banner_parent.classList.add('-hide')

      var should_display_freelinks = config['display_collection_icons_' + util.PAGE_NAME] || config['display_collection_icons']
      should_display_freelinks === 'no' && frlink_parent.classList.add('-hide')

      var should_display_catalog = config['display_catalog_' + util.PAGE_NAME] || config['display_catalog']
      should_display_catalog === 'no' && list.map(el => el.style.display = 'none')

      config.display_featurebox_title === 'no' && title.classList.add('-hide')
    }

    function buildTitle(config) {
      title.innerHTML = config.featurebox_title
    }

    function buildBanner(config) {
      var banner_1_db = util.is_mobile ? config.campaign_1_mdb : config.campaign_1_ddb
      var banner_2_db = util.is_mobile ? config.campaign_2_mdb : config.campaign_2_ddb
      var banner_1_url = config.campaign_1_url
      var banner_2_url = config.campaign_2_url
      var list = [
        { image: banner_1_db, url: banner_1_url },
        { image: banner_2_db, url: banner_2_url }
      ]
      banner_parent.innerHTML = list.map(bannerHTML).join('')
    }

    function bannerHTML(banner) {
      return `<a href="${banner.url}" class="-posabs -bn"><span class="-posabs -preloader -loading"></span><img alt="banner" data-src="${banner.image}" class="lazy-image"/></a>`
    }

    function buildFreelinks(list) {
      var freelinks = list.filter(datum => datum.initiative === util.FREELINK_NAME)
      frlink_parent.innerHTML = freelinks.map(freelinkHTML).join('')
      feature_box.emit(util.FREELINKS_BUILT, {})
    }

    function freelinkHTML(freelink) {
      var tag_attribute = freelink.tag ? `data-tag="${freelink.tag}"` : ''
      return `<a href="${freelink.url}" ${tag_attribute} class="-inlineblock -vatop -freelink"><div class="-img -posrel"><span class="-posabs -preloader -loading"></span><img data-src="${freelink.image}" alt="" class="lazy-image"/></div><div class="-txt">${freelink.name}</div></a>`
    }

    return { init }
  })

  var Controller = (function (json) {
    var json = json || {}
    var domain = json.domain || {}
    var config = json.config || {}
    var products = util.el('.-products')
    var temp_host = util.el('.-temporary-host')
    var header_query = util.is_mobile ? '.-filter-list' : '.-header'
    var html_el = document.querySelector('html')
    var header = util.el(header_query)
    var catalog_query = util.is_mobile ? '.-col.-filters' : '.-row.-catalog'
    var catalog = util.el(catalog_query)
    var products_found = util.el('.-catalog') || { style: { display: 'block' } }
    var filters_el = util.el('.-filters')

    var fetch_loaders = [header, filters_el, html_el]
    var url_params = util.url_params

    url_params.tag = json.config.campaign_tag

    function init() {
      pubsub.subscribe(util.FILTER_UPDATED, filterUpdated)
      pubsub.subscribe(util.UPDATE_URL, start)
      // updateBanner()
      BannersFreelinksTitle([header, catalog, products_found]).init()
      feature_box.subscribe(util.FREELINKS_BUILT, freelinkListener)
      start(url_params)
    }

    function freelinkListener() {
      if (util.FREELINK_NAME === 'Gift Finder') {
        var freelinks = document.querySelectorAll('.-freelinks .-freelink')
        freelinks.forEach(freelink => {
          freelink.addEventListener('click', evt => {
            evt.preventDefault()
            var tag = freelink.getAttribute('data-tag')
            util.url_params.tag = tag
            start(util.url_params, null)
          })
        })

      }
    }
    function start(param, url) {
      util.is_mobile ? mobile(param, url) : desktop(param, url)
    }

    function desktop(param, url) {
      var beautifier = urlBeautifier(param, url)
      fetchPreload('add')
      return scrape(beautifier.url)
        .then(desktopExtract)
        .then(processData)
        .then(sendData)
        .then(buildData)
        .catch(err => {
          filterUpdated()
          // util.unsuccessful(err)
        })
    }

    function mobile(param, url) { 
      var beautifier = urlBeautifier(param, url)
      fetchPreload('add')
      Promise.all(mobileScraping(beautifier))
        .then(mobileDataPrepping)
        .then(processData)
        .then(sendData)
        .then(buildData)
        .catch(err => {
          filterUpdated()
          // util.unsuccessful(err)
        })
    }

    function mobileScraping(beautifier) {
      return [
        { url: beautifier.url, type: util.PRODUCTS },
        { url: beautifier.filters, type: util.FILTERS }
      ].map(json => {
        return scrape(json.url).then(data => mobileExtract(data, json.type))
      })
    }

    function mobileDataPrepping(data) {
      var c_list = list({ data, type: 'category' })
      var b_list = list({ data, type: 'brand' })

      var json = {
        skus: data[0].products, categories: reducer(c_list),
        brands: reducer(b_list), sku_details: util.sku_details
      }
      return json
    }

    function urlBeautifier(param, url) {
      var temp_url = url
      if (param) {
        temp_url = util.url(param, domain)
        temp_url = temp_url.split("//").join("/")
      }
      var link_obj = new URL(temp_url)
      var pathname_search = link_obj.pathname + link_obj.search
      var url = link_obj.origin + pathname_search

      var filters = util.filters_url({ host: domain.host, url: pathname_search })

      return { url, filters }
    }

    function filterUpdated() {
      fetchPreload('remove')
    }

    function sendData(data) {
      pubsub.emit(util.UPDATE_UI, data)
      return data
    }

    function skusPerPage() {
      var skus_per_page = config['skus_per_page_' + util.PAGE_NAME] || config.skus_per_page || 40
      return parseInt(skus_per_page)
    }

    function skus(data) {
      return data.skus.slice(0, skusPerPage())
    }

    function buildData(data) {
      products.innerHTML = skus(data).map(html).join('')
      image_observer = new ImageObserver()
      pubsub.emit(util.PRODUCTS_DISPLAYED, {})
      util.is_mobile && scrollListener()
    }

    function scrollListener() {
      products.addEventListener('scroll', () => isAtScrollEdge(products) && loadMore())
    }

    function isAtScrollEdge(products) {
      return products.scrollLeft + products.clientWidth >= products.scrollWidth
    }

    function loadMore() {
      var hidden_products = document.querySelectorAll('.-product.-hide')
      for (var i = 0; i < 5; i++) {
        var fn = hidden_products[i]
        fn && fn.classList.remove('-hide')
      }
    }

    function badge(datum) {
      if (datum.badges) {
        var badges = Object.keys(datum.badges).map(key => {
          var badge = datum.badges[key]
          return key === 'main' ? `<span class="-badge -main -posabs -${util.id(badge.name)}">${badge.name}</span>` : `<img class="-badge -campaign -posabs lazy-image" data-src="${badge.image}" alt="badge"/>`
        })
        return badges.join('')
      } else return ''
    }

    function html(datum, idx) {
      if (datum.url === undefined) {
        console.log('datum', datum)
        datum.url = "/catalog/?q=" + datum.sku
      }
      var oldprice_discount = datum.prices.discount ? `<div class="-price-discount"><div class="-pd -price -old -posrel"><div class="-text">${datum.prices.oldPrice}</div></div><div class="-pd -discount -posrel"><div class="-text">${datum.prices.discount}</div></div></div>` : ''

      var rating = datum.rating ? `<div class="-product_rating"><div class="-stars -radio-el -posrel -inlineblock -vamiddle"><div class="-in" style="width:${util.percent(datum.rating.average)}%"></div></div><div class="-count -inlineblock -vabaseline -posrel"><div class="-rt">(${datum.rating.totalRatings})</div></div></div>` : ''

      var express = datum.shopExpress ? `<div class="-express -list -posrel"><express></express></div>` : ''

      var free_shipping = datum.shopExpress ? `<div class="-free-shipping -posrel"><div class="-text">${datum.shopExpress.text ? datum.shopExpress.text : ''}</div></div>` : ''

      var global = datum.shopGlobal ? `<div class="-tag -posrel"><span class="-global">${datum.shopGlobal.name}</span></div>` : ''

      var stock = datum.stock ? `<div class="-stock"><div class="-txt">${datum.stock.text ? datum.stock.text : '0 stock left'}</div><div class="-stock-bar" style="width:${datum.stock.percent}%"></div></div>`: ''

      var product_class = util.is_mobile && idx > 5 ? '-product -hide' : '-product'
      return `<a href="${domain.host}${datum.url}" class="${product_class}" target="_blank">
        <div class="-img -posrel">
          <span class="-posabs -preloader -loading"></span>
          ${badge(datum)}
          <img class="lazy-image" data-src="${datum.image}" alt="product"/>
        </div>
        <div class="-details">
          ${global}
          <div class="-name -posrel">
            <div class="-text">${datum.displayName}</div>
          </div>
          <div class="-price -new -posrel">
            <div class="-text">${datum.prices.price}</div>
          </div>
          ${oldprice_discount}
          ${rating}
          ${express}
          ${free_shipping}
          ${stock}
        </div>
        <div class="-cta -posrel">
          <div class="-text">add to cart</div>
        </div>
      </a>`
    }

    function processData(data) {
      data.skus = data.skus.filter(passesFilter)
      data.tags = tagData()
      data.country = json.config.country_name
      data.currency = json.config.currency
      return data
    }

    function tagData() {
      return json.json_list.filter(item => item.initiative === 'Tag')
    }

    function passesFilter(datum) {
      var rcs = util.rem_content
        .filter(rc => datum.categories.indexOf(rc) > -1)
      return rcs.length === 0 ? true : false
    }

    function desktopExtract(data) {
      var cb = categoriesBrands(data)
      var start = data.indexOf('window.__STORE__=') + 17
      var end = data.indexOf('};</scr') + 1
      var json = data.substring(start, end)
      try { return { skus: JSON.parse(json).products, categories: cb.categories, brands: cb.brands, sku_details: skuDetails(data) } }
      catch (error) { console.log('error', error); return [] }
    }

    function mobileExtract(data, type) {
      var start = data.indexOf('window.__INITIAL_STATE__=') + 25
      var end = data.indexOf(';window.__CONFS__')
      var json = data.substring(start, end)
      var parsed = JSON.parse(json)

      if (type === util.PRODUCTS) util.sku_details = skuDetails(data)
      try { return parsed.viewData }
      catch (error) { return [] }
    }

    function list(json) {
      var filters = json.data[1].filters
      return filters.find(item => item.id === json.type).options
    }

    function reducer(list) {
      return list.reduce((acc, category) => {
        var name = category.text
        var link = category.value.split('-')
          .filter(pieces => isNaN(pieces)).join('-')
        acc[name] = { name, link }
        return acc
      }, {})
    }

    function skuDetails(data) {
      var reg_exp = new RegExp(/(\d+ résultats)|(\d+ products found)/)
      var list = reg_exp.exec(data)

      var found = list ? parseInt(list[0].split(' ')[0]) : 0
      var pages = Math.ceil(found / util.SKUS_PER_PAGE)
      pages = pages > util.MAX_PAGE ? util.MAX_PAGE : pages
      return { found, pages }
    }

    function categoriesBrands(data) {
      temp_host.innerHTML = data
      var cat_els = temp_host.querySelectorAll('.-me-start .-hov-bg-gy05')
      var brd_els = temp_host.querySelectorAll('.-me-start.-fsh0')

      var categories = Array.from(cat_els).reduce(catBrandReducer, {})
      var b_filtered = Array.from(brd_els).filter(isolateBrands)
      var brands = b_filtered.reduce(catBrandReducer, {})

      temp_host.innerHTML = ''
      return { categories, brands }
    }

    function catBrandReducer(acc, catBrand) {
      var name = catBrand.textContent
      var link = catBrand.getAttribute('href')
      var is_umbrella_cat = catBrand.classList.contains('-phm')
      var is_bold = catBrand.classList.contains('-m')
      acc[name] = { name, link, is_umbrella_cat, is_bold }
      return acc
    }

    function isolateBrands(brand) {
      var name = brand.textContent
      var link = brand.getAttribute('href')
      var test = util.brandToURL(name)
      var brand_idx = link.indexOf(test)
      var quest_idx = link.indexOf('?')

      var other_filter_idx = link.indexOf('=' + name)
      return brandCondition({
        brand_idx, quest_idx, name,
        other_filter_idx, brand
      })
    }

    function brandCondition(json) {
      /** url before the query question mark */
      var url_b4_qmark = json.brand_idx < json.quest_idx
      /** url is found in the link */
      var url_found_n_lnk = (json.brand_idx !== -1) || json.brand.classList.contains('_chkd')
      /** is a brand with name */
      var is_with_name = json.name !== ''
      /** is not another filter */
      var is_not_another_filter = json.other_filter_idx === -1

      return url_b4_qmark && url_found_n_lnk &&
        is_with_name && is_not_another_filter
    }

    function scrape(url) {
      return fetch(url)
        .then(res => res.text())
      // .catch(util.unsuccessful.bind('Controller scrape'))
    }

    function fetchPreload(action) {
      fetch_loaders.map(fl => fl.classList[action]('-fetch-loading'))
    }

    return { init }
  })

  var Filters = (function () {
    class FilterBar {
      /**
       * 
       * @param {Controller} controller 
       */
      constructor() {
        this.filters_trigger = util.el('.-filters-trigger .-trigger')
        this.filters = util.el('.-col.-filters')

        this.sort_trigger = util.el('.-sort-by')
        this.sort_dpdw = util.el('.-right')

        this.filters_trigger.addEventListener('click', () => this.filters.classList.toggle('-open'))
        this.sort_trigger.addEventListener('click', () => this.toggle())
      }

      toggle() {
        this.sort_trigger.classList.toggle('-show')
        this.sort_dpdw.classList.toggle('-show')
      }
    }


    class Filter {
      constructor() { 
        this.url_params = util.url_params
        this.is_ui_in_place = false

        this.exclusions = ['mlp-promotional-page', 'catalog', 'all-products']

        this.filter_name = 'filter'
        this.catURL = link => {
          var pieces = link.split('/')
          .filter(piece => this.exclusions.indexOf(piece) === -1)
          .filter(piece => piece !== '')
          return pieces[0]
        }
        this.updateURL = data => this.url_params = data

        this.header_query = util.is_mobile ? '.-filter-list .-sub-header' : '.-header .-controls'
        this.header = util.el(this.header_query)
        this.header.addEventListener('click', this.listen.bind(this))
      }

      assignParams(from, to) {
        to = JSON.parse(JSON.stringify(from))
      }

      init() {
        pubsub.subscribe(util.UPDATE_URL, this.updateURL.bind(this))
        pubsub.subscribe(util.UPDATE_UI, this.updateUi.bind(this))
      }
      listeners() { }
      updateUi() { }
      urlParams(link) {
        this.url_params[this.filter_name] = link
        return this.url_params
      }
      notify(param) {
        pubsub.emit(util.UPDATE_URL, param)
      }
      listen(evt) { }
    }

    class AppliedFilters extends Filter {
      constructor() {
        super()
        this.all = util.el('.-applied-filters .-all')

        this.header.removeEventListener('click', this.listen.bind(this))
        this.all.addEventListener('click', this.listen.bind(this))

        this.init()
      }

      init() {
        pubsub.subscribe(util.UPDATE_URL, this.updateParam.bind(this))
      }

      listen(evt) {
        var el = evt.target
        if (el.classList.contains('-applied-filter')) {
          var param = this.process(el)
          this.notify(param)
        }
      }

      process(el) {
        var key = el.getAttribute('data-key')
        this.url_params[key] = ''
        return this.url_params
      }

      updateParam(data) {
        this.url_params = data
        this.all.innerHTML = Object.keys(data)
          .filter(key => data[key] !== '')
          .map(key => {
            return { key, value: data[key] }
          }).map(this.html).join('')
      }

      html(json) {
        var id_param = json.key + '-' + json.value
        return `<div id="${id_param}" data-key="${json.key}" data-value="${json.value}" class="-applied-filter" data-name="${util.id(id_param)}">${json.key}: ${json.value}</div>`
      }
    }

    class CategoryFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'category'
        this.categories_el = util.el('.-categories')
        this.reset_btn = util.el('.-filter.-category .-ctac')
        this.category_widget = util.el('.-filter .-categories')
        this.header.removeEventListener('click', this.listen.bind(this))

        this.init()

        this.reset_btn.addEventListener('click', evt => {
          util.url_params = {
            brand: '',
            rating: '',
            price: '',
            discount: '',
            shop_premium_services: '',
            shipped_from: '',
            search: '',
            category: '',
            page: '',
            sort: '',
            tag: '',
            type: ''
          }
          this.notify(util.url_params)
        })
        this.category_widget.addEventListener('click', evt => {
          var param = this.process(evt)
          this.notify(param)
        })
      }

      updateUi(data) {
        var categories = data.categories
        this.categories_el.innerHTML = Object.entries(categories)
          .map(datum => this.html(datum)).join('')
        pubsub.emit(util.FILTER_UPDATED, {})
        return this
      }

      html(datum) {
        var name = datum[0]
        var url = util.is_mobile ? datum[1].link : this.catURL(datum[1].link)
        var is_umbrella_cat = datum[1].is_umbrella_cat
        var is_bold = datum[1].is_bold
        var class_list = ['-item']
        class_list.push(is_umbrella_cat ? '-umbrella-cat' : '')
        class_list.push(is_bold ? '-bold' : '')
        var _class = class_list.join(' ')
        return `<div data-url="${url}" id="${util.id(name)}" data-name="${name}" class="${_class}">${name}</div>`
      }

      process(evt) {
        var url = evt.target.getAttribute('data-url')
        return this.urlParams(url)
      }
    }

    class BrandFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'brand'
        this.TYPE = 'checkbox'
        this.brands_el = util.el('.-filter.-brand .-list')
        this.search_el = util.el('.-filter.-brand .-search input')
        this.brands_widget = util.el('.-filter.-brand')
        this.list = []
        this.selection = []
        this.isABrand = evt => evt.target.getAttribute('type') == this.TYPE
        this.header.removeEventListener('click', this.listen.bind(this))

        this.init()
        this.search_el.addEventListener('keyup', evt => {
          var term = evt.target.value.toLowerCase()
          var filtered = this.filteredBrands({ term, list: this.list })
          util.addAndRemove(this.list, filtered, '-hide')
        })
        this.brands_widget.addEventListener('click', evt => {
          if (this.isABrand(evt)) {
            var param = this.process(evt.target.value)
            this.notify(param)
          }
        })
      }

      updateUi(data) {
        var brands = data.brands
        var chkd = this.checked()

        this.brands_el.innerHTML = Object.entries(brands)
          .map(this.html.bind({ checked_br_ids: chkd.ids })).join('')

        this.list = this.brands_el.querySelectorAll('.-brand .md-checkbox')

        chkd.brands.map(brand => this.brands_el.prepend(brand))
        pubsub.emit(util.FILTER_UPDATED, {})

        return this
      }

      checked() {
        var all_brands = Array.from(this.brands_el.querySelectorAll('.md-checkbox'))

        var brands = all_brands.filter(brd => brd.querySelector('input[type="checkbox"]').checked)

        return { brands, ids: brands.map(brd => brd.getAttribute('id')) }
      }

      html(datum) {
        var name = datum[0]
        var url = util.id(name)
        var new_label = `<label class="md-checkbox" id="${url}"><input type="checkbox" value="${url}" /><span>${name}</span></label>`
        var idx = this.checked_br_ids.indexOf(url)
        return idx === -1 ? new_label : ''
      }

      filteredBrands(json) {
        return Array.from(json.list).filter(brand => {
          var name_el = brand.querySelector('.md-checkbox>span')
          var name = name_el.textContent.toLowerCase()
          return name.indexOf(json.term) !== -1
        })
      }

      process(term) {
        var is_selected = this.alreadySelected(term)
        is_selected.state ? this.selection.splice(is_selected.idx, 1) : this.selection.push(term)
        var value = this.selection.join('--')
        return this.urlParams(value)
      }

      alreadySelected(term) {
        var idx = this.selection.indexOf(term)
        return { idx, state: idx !== -1 }
      }
    }

    class TagFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'tag'
        this.TYPE = 'radio'
        this.is_ui_in_place = false
        this.isATag = evt => evt.target.getAttribute('type') == this.TYPE
        this.header.removeEventListener('click', this.listen.bind(this))

        this.tags_el = util.el('.-tag .-list')

        this.init()

        this.tags_el.addEventListener('click', evt => {
          if (this.isATag(evt)) {
            var param = this.process(evt)
            this.notify(param)
          }
        })
      }

      updateUi(data) {
        if (this.is_ui_in_place == false) {
          this.is_ui_in_place = true
          this.tags_el.innerHTML = data.tags.map(this.html).join('')
          pubsub.emit(util.FILTER_UPDATED, {})
        }
      }

      html(tag) {
        return `<div class="md-radio"><input type="radio" id="${util.id(tag.name)}" data-name="${tag.name}" name="tag" value="${tag.parameter}" /><label for="${util.id(tag.name)}"><div class="-txt -radio-el" style="background-color:${tag.bg_color};color:${tag.text_color}">${tag.name}</div></label></div>`
      }

      process(evt) {
        var url = evt.target.value
        return this.urlParams(url)
      }
    }

    class DiscountFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'discount'
        this.TYPE = 'radio'
        this.is_ui_in_place = false

        this.isDiscount = evt => evt.target.getAttribute('type') == this.TYPE
        this.header.removeEventListener('click', this.listen.bind(this))

        this.discount_el = util.el('.-discount-percentage .-list')

        this.init()

        this.discount_el.addEventListener('click', evt => {
          if (this.isDiscount(evt)) {
            var param = this.process(evt)
            this.notify(param)
          }
        })
      }

      updateUi() {
        if (this.is_ui_in_place == false) {
          this.is_ui_in_place = true
          this.discount_el.innerHTML = util.discounts.map(this.html).join('')
          pubsub.emit(util.FILTER_UPDATED, {})
        }
      }

      html(discount) {
        return `<div class="md-radio"><input type="radio" id="d${util.id(discount.name)}" name="discount" value="${discount.value}" /><label for="d${util.id(discount.name)}"><div class="-txt -radio-el">${discount.name}</div></label></div>`
      }

      process(evt) {
        var url = evt.target.value
        return this.urlParams(url)
      }
    }

    class RatingFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'rating'
        this.TYPE = 'radio'
        this.is_ui_in_place = false

        this.isRating = evt => evt.target.getAttribute('type') == this.TYPE
        this.header.removeEventListener('click', this.listen.bind(this))

        this.rating_el = util.el('.-product-rating .-list')

        this.init()

        this.rating_el.addEventListener('click', evt => {
          if (this.isRating(evt)) {
            var param = this.process(evt)
            this.notify(param)
          }
        })
      }

      updateUi() {
        if (this.is_ui_in_place == false) {
          this.is_ui_in_place = true
          this.rating_el.innerHTML = util.ratings.map(this.html).join('')
          pubsub.emit(util.FILTER_UPDATED, {})
        }
      }

      html(rating) {
        return `<div class="md-radio"><input type="radio" id="${rating.name}" name="rating" value="${rating.value}" />
        <label for="${rating.name}"><div class="-stars -radio-el"><div class="-in" style="width:${rating.percent}"></div></div><div class="-txt -radio-el">& above</div></label></div>`
      }

      process(evt) {
        var url = evt.target.value
        return this.urlParams(url)
      }
    }

    class PriceFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'price'
        this.is_ui_in_place = false

        this.isPrice = evt => evt.target.classList.contains('-ctac')
        this.header.removeEventListener('click', this.listen.bind(this))

        this.price_el = util.el('.-filter.-price')

        this.init()

        this.price_el.addEventListener('click', evt => {
          if (this.isPrice(evt)) {
            var param = this.process(evt)
            this.notify(param)
          }
        })
      }

      updateUi(data) {
        if (this.is_ui_in_place == false) {
          this.is_ui_in_place = true
          this.price_el.innerHTML = this.html(data.currency)
          pubsub.emit(util.FILTER_UPDATED, {})
        }
      }

      html(currency) {
        return `<div class="-title -posrel"><div class="-text -posabs">price (${currency})</div><div class="-ctac -posabs">apply</div></div><div class="price-wrap"><div class="-pw -tb price-wrap-1"><label for="min-price">${currency}</label><input type="number" min="5" max="100000000" id="min-price" value="5" /></div><div class="-pw price-wrap_line">-</div><div class="-pw -tb price-wrap-2"><label for="max-price">${currency}</label><input type="number" min="5" max="100000000"id="max-price" value="100000000" /></div></div>`
      }

      process() {
        var min_price = util.el('#min-price').value
        var max_price = util.el('#max-price').value
        var price_range = min_price + '-' + max_price
        return this.urlParams(price_range)
      }
    }

    class ShippedFromFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'shipped_from'
        this.TYPE = 'checkbox'
        this.is_ui_in_place = false
        this.checked = []

        this.isShippedFrom = evt => evt.target.getAttribute('type') == this.TYPE
        this.header.removeEventListener('click', this.listen.bind(this))

        this.shipped_from_el = util.el('.-shipped-from .-list')

        this.init()

        this.shipped_from_el.addEventListener('click', evt => {
          if (this.isShippedFrom(evt)) {
            var param = this.process(evt)
            this.notify(param)
          }
        })
      }

      updateUi(data) {
        if (this.is_ui_in_place == false) {
          this.is_ui_in_place = true
          var shipped_froms = util.shippedFroms(data.country)
          this.shipped_from_el.innerHTML = shipped_froms.map(this.html).join('')
          pubsub.emit(util.FILTER_UPDATED, {})
        }
      }

      html(shipped_from) {
        return `<label class="md-checkbox"><input type="checkbox" name="shipped_from" value="${shipped_from.value}" /><span><element class="${shipped_from.class_name}">${shipped_from.name}</element></span></label>`
      }

      process(evt) {
        var value = evt.target.value
        var is_checked = this.isChecked(value)
        is_checked.state ? this.checked.splice(is_checked.idx, 1) : this.checked.push(value)
        var url = this.checked.join('--')
        return this.urlParams(url)
      }

      isChecked(value) {
        var idx = this.checked.indexOf(value)
        return { idx, state: idx !== -1 }
      }
    }

    class ExpressFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'shop_premium_services'
        this.TYPE = 'checkbox'
        this.is_ui_in_place = false
        this.checked = []

        this.isExpress = evt => evt.target.getAttribute('type') == this.TYPE
        this.header.removeEventListener('click', this.listen.bind(this))

        this.express_el = util.el('.-express-shipping .-list')

        this.init()

        this.express_el.addEventListener('click', evt => {
          if (this.isExpress(evt)) {
            var param = this.process(evt)
            this.notify(param)
          }
        })
      }

      updateUi() {
        if (this.is_ui_in_place == false) {
          this.is_ui_in_place = true
          this.express_el.innerHTML = this.html()
          pubsub.emit(util.FILTER_UPDATED, {})
        }
      }

      html() {
        return '<label class="md-checkbox"><input type="checkbox" name="shop_premium_services"value="shop_premium_services" /><span><express></express></span></label>'
      }

      process(evt) {
        var value = evt.target.value
        var is_checked = this.isChecked(value)
        is_checked.state ? this.checked.splice(is_checked.idx, 1) : this.checked.push(value)
        var url = this.checked.join('--')
        return this.urlParams(url)
      }

      isChecked(value) {
        var idx = this.checked.indexOf(value)
        return { idx, state: idx !== -1 }
      }
    }

    class SortFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'sort'
        this.sort_el = util.el('.-right')

        this.isSortFilter = evt => evt.target.classList.contains('-dpdw')

        this.isSortOption = evt => evt.target.classList.contains('-option')

        this.mobileCheck()
        this.init()
      }

      mobileCheck() {
        if (util.is_mobile) {
          this.header.removeEventListener('click', this.listen.bind(this))
          this.sort_el.addEventListener('click', this.listen.bind(this))
        }
      }

      listen(evt) {
        if (this.isSortFilter(evt)) {
          this.sort_el.classList.toggle('-show')
        }

        if (this.isSortOption(evt)) {
          this.sort_el.classList.remove('-show')
          var param = this.process(evt)
          this.notify(param)
        }
      }

      process(evt) {
        var url = evt.target.getAttribute('data-query')
        return this.urlParams(url)
      }
    }

    class SearchFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'search'
        this.search_inpt = util.el('.-search-input')
        this.search_btn = util.el('.-search-btn')
        this.filters = util.el('.-col.-filters')

        this.main_header = document.querySelector('.main_header--nav-right')
        this.isSearch = evt => evt.target.classList.contains('-search-btn')

        this.mobileCheck()
        this.main_header && this.attachSearchIcon()
        this.init()
      }

      attachSearchIcon() {
        var search = document.createElement('span')
        search.className = '-inline-block -vamiddle -search-icn -top-search'
        this.main_header.prepend(search)
        search.addEventListener('click', evt => this.filters.classList.toggle('-open'))
      }

      listen(evt) {
        evt.preventDefault()
        if (evt.target.classList.contains('-search-btn')) {
          var param = this.process(evt)
          this.notify(param)
        }
      }

      mobileCheck() {
        if (util.is_mobile) {
          this.header.removeEventListener('click', this.listen.bind(this))
          this.search_btn.addEventListener('click', this.listen.bind(this))
        }
      }

      process() {
        var value = this.search_inpt.value
        return this.urlParams(value)
      }
    }

    class PaginationFilter extends Filter {
      constructor() {
        super()
        this.filter_name = 'page'
        this.skus_found_el = util.el('.-products-found')
        this.page_status_el = util.el('.-status')
        this.page_num_el = util.el('.-num')

        this.page_no = 1

        this.isJumpToPage = evt => evt.target.classList.contains('-to-page')
        this.isNextPage = evt => evt.target.classList.contains('-next')
        this.isPrevPage = evt => evt.target.classList.contains('-prev')
        this.productsFound = data => data.sku_details.found + ' products found'
        this.pageStatus = data => this.page_no + ' / ' + data.sku_details.pages


        this.init()
      }

      updateUi(data) {
        this.skus_found_el.innerHTML = this.productsFound(data)
        this.page_status_el.innerHTML = this.pageStatus(data)
        this.page_num_el.value = this.page_no
      }

      listen(evt) {
        if (this.isPrevPage(evt)) {
          this.goToPrevPage()
          this.processAndNotify()
        }

        if (this.isNextPage(evt)) {
          this.goToNextPage()
          this.processAndNotify()
        }

        if (this.isJumpToPage(evt)) {
          this.jumpToPage()
          this.processAndNotify()
        }
      }

      jumpToPage() {
        var value = this.page_num_el.value
        value = parseInt(value) > util.MAX_PAGE ? util.MAX_PAGE : value
        value = parseInt(value) < 1 ? 1 : value
        this.page_no = value
      }

      goToPrevPage() {
        this.page_no = this.page_no == 1 ? 1 : (parseInt(this.page_no) - 1)
      }

      goToNextPage() {
        this.page_no = this.page_no == util.MAX_PAGE ? util.MAX_PAGE : (parseInt(this.page_no) + 1)
      }

      processAndNotify() {
        var param = this.process()
        this.notify(param)
      }

      process() {
        return this.urlParams(this.page_no)
      }
    }

    new CategoryFilter()
    new BrandFilter()
    new TagFilter()
    new DiscountFilter()
    new RatingFilter()
    new PriceFilter()
    new ShippedFromFilter()
    new ExpressFilter()

    new SortFilter()
    new SearchFilter()
    new PaginationFilter()

    if (util.is_mobile) {
      new FilterBar()
      new AppliedFilters()
    }
  })

  var Main = (function (json) {
    var firestore = util.firestore
    var element = document.getElementById(json.element_id)

    function firestore_db() {
      firestore.getDocument(util.COLLECTION, 'data')
        .then(updateDomain)
        .then(run.bind('firebase'))
        .catch(util.unsuccessful.bind('From Firebase'))
    }

    function updateDomain(data) {
      Object.assign(data.domain, domain(data.config))
      return data
    }

    function init() {
      start()
    }

    function start() {
      element.innerHTML = util.is_mobile ? mobileSkeletonHTML() : desktopSkeletonHTML()

      firestore_db()
      Filters()
      if (util.is_mobile == false) new PreProcess()
    }

    function run(json) {
      Controller(json).init()
      pubsub.emit(util.FETCHED_DATA, json)
    }

    function domain(config) {
      var is_mobile = 'ontouchstart' in window
      var campaign_banner = is_mobile ? config.campaign_banner_mobile : config.campaign_banner_desktop
      var all_products = config.all_products_catalog ? config.all_products_catalog : 'all-products'
      var host = config.host + config.country_domain
      return {
        campaign: config.campaign,
        url: config.campaign_url,
        catalog: host + `/${all_products}/`,
        catalogSearch: host + '/catalog',
        currency: config.currency,
        host, campaign_banner,
        campaign_url: config.campaign_url
      }
    }

    function desktopSkeletonHTML() {
      return '<div class="-featurebox-title"></div><div class="-banner -row -posrel -feature-box"></div><div class="-freelinks -row"></div><div class="-temporary-host -hide"></div><div class="-header -posrel"><div class="-jumia-loader-wrap -posabs"><div class="-jumia-loader -posabs"><div class="-cart -posabs"></div><div class="-circle -posabs"><i class="-fl-star"></i></div></div></div><div class="-controls -posrel"><div class="-left -posabs">Results</div><form class="-center -posabs"><span class="-search-icn -center-el -posabs"></span><input type="text" placeholder="Search products, brands and categories" name="search" class="-search-input -center-el" required /><div class="-search-btn -center-el -cta">search</div></form><div class="-pagination -posabs"><span class="-col -prev"></span><div class="-col -status">- / -</div><span class="-col -next"></span><input class="-col -num" type="number" name="page" value="1" /><div class="-inlineblock -vamiddle -to-page -cta -posrel"></div></div><div class="-right -posabs"><label class="-dpdw" for="dpdw-sort">Sort by: Popularity</label><div class="-dropdown"><div class="-option" data-query="" data-value="Sort by: Popularity">Popularity</div><div class="-option" data-query="newest" data-value="Sort by: Newest Arrivals">Newest Arrivals</div><div class="-option" data-query="lowest-price" data-value="Sort by: Price: Low to High">Price: Low to High </div><div class="-option" data-query="highest-price" data-value="Sort by: Price: High to Low">Price: High to Low </div><div class="-option" data-query="rating" data-value="Sort by: Product Rating">Product Rating</div></div></div></div></div><div class="-row -catalog"><div class="-col -w25 -inlineblock -vatop -filters"><div class="-filter -category"><div class="-title -posrel"><div class="-text -posabs">category</div><div class="-ctac -posabs" data-url="">reset</div></div><div class="-categories"></div></div><div class="-filter -brand"><div class="-title">brand</div><div class="-search -posrel"><span class="-search-icn"></span><input type="search" placeholder="Search" /></div><div class="-list"></div></div><form class="-filter -product-rating"><div class="-title">product rating</div><div class="-list"></div></form><fieldset class="-filter -price"></fieldset><form class="-filter -discount-percentage"><div class="-title">discount percentage</div><div class="-list"></div></form><div class="-filter -express-shipping"><div class="-title">express shipping</div><div class="-list"></div></div><div class="-filter -shipped-from"><div class="-title">shipped from</div><div class="-list"></div></div><form class="-filter -tag"><div class="-title">collections</div><div class="-list"></div></form></div><div class="-col -w75 -inlineblock -vatop -filter-list-products" id="catalog-listing"><div class="-filter-list"><div class="-sub-header -posrel"><div class="-products-found -posabs">0 products found</div></div></div><div class="-products"></div></div></div>'
    }

    function mobileSkeletonHTML() {
      return '<div class="-featurebox-title"></div><div class="-banner -row -posrel -featurebox"></div><div class="-freelinks -row"></div><div class="-temporary-host -hide"></div><div class="-col -filters"><div class="-filters-trigger -posrel"><div class="-sort-by -posabs"><span class="-arrow -icon"></span><div class="-stack -icon"><span class="-step"></span><span class="-step"></span><span class="-step"></span><span class="-step"></span></div></div><div class="-applied-filters -posabs"><div class="-all -posabs"></div></div><span class="-spinner -posabs"></span><div class="-trigger -posabs"><span class="-txt">Filters</span><span class="-arrow"></span></div></div><div class="-filter-shell"><form class="-center"><label class="-search-icn -center-el -posabs" for="sc"></label><input id="sc" type="text" placeholder="Search products, brands ..." name="search" class="-search-input -center-el" required /><div class="-search-btn -center-el -cta">search</div></form><div class="-filter -category"><div class="-title -posrel"><div class="-text -posabs">category</div><div class="-ctac -posabs">reset</div></div><div class="-categories"></div></div><div class="-filter -brand"><div class="-title">brand</div><div class="-search -posrel"><span class="-search-icn"></span><input type="search" placeholder="Search" /></div><div class="-list"></div></div><form class="-filter -product-rating"><div class="-title">product rating</div><div class="-list"></div></form><fieldset class="-filter -price"></fieldset><form class="-filter -discount-percentage"><div class="-title">discount percentage</div><div class="-list"></div></form><div class="-filter -express-shipping"><div class="-title">express shipping</div><div class="-list"></div></div><div class="-filter -shipped-from"><div class="-title">shipped from</div><div class="-list"><label class="md-checkbox"><input type="checkbox" data-name="Shipped from abroad" name="shipped_from" value="jumia_global" /><span><global class="-global">Shipped from abroad</global></span></label><label class="md-checkbox"><input type="checkbox" data-name="Local Shipping" name="shipped_from" value="country_local" /><span>Shipped from Nigeria</span></label></div></div><form class="-filter -tag"><div class="-title">collections</div><div class="-list"></div></form></div><div class="-right -posabs"><div class="-dropdown"><div class="-option" data-query="popularity" data-value="Sort by: Popularity">Popularity</div><div class="-option" data-query="newest" data-value="Sort by: Newest Arrivals">Newest Arrivals</div><div class="-option" data-query="lowest-price" data-value="Sort by: Price: Low to High">Price: Low to High</div><div class="-option" data-query="highest-price" data-value="Sort by: Price: High to Low">Price: High to Low </div><div class="-option" data-query="rating" data-value="Sort by: Product Rating">Product Rating</div></div><label class="-dpdw" for="dpdw-sort">Sort by: Popularity</label></div></div><div class="-catalog -col -filter-list-products" id="catalog-listing"><div class="-filter-list -posrel"><div class="-jumia-loader-wrap -posabs"><div class="-jumia-loader -posabs"><div class="-cart -posabs"></div><div class="-circle -posabs"><i class="-fl-star"></i></div></div></div><div class="-sub-header -posrel"><div class="-pagination -posabs"><span class="-col -prev"></span><div class="-col -status">- / -</div><span class="-col -next"></span><input class="-col -num" type="number" name="page" value="1" /><div class="-inlineblock -vamiddle -to-page -cta -posrel"><span class="-text -posabs"></span><span class="-arrow -posabs"></span></div></div></div></div><div class="-products-found">0 products found</div><div class="-products"></div></div>'
    }

    return { init }
  })

  Main(json).init()

  return { subscribe: pubsub.subscribe, FETCHED_DATA: util.FETCHED_DATA, ImageObserver, emit: pubsub.emit, is_mobile: util.is_mobile, PRODUCTS_DISPLAYED: util.PRODUCTS_DISPLAYED, getDocument: util.firestore.getDocument, saveDocument: util.firestore.saveDocument }
})