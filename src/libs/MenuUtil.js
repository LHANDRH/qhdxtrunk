// import axios from 'axios'
// import env from '../../config/env'
import lazyLoading from './lazyLoading.js'
import { getUserMenuAndPerm } from '@/api/routers'
let util = {

}
util.title = function (title) {
  title = title || 'iView admin'
  window.document.title = title
}

// const ajaxUrl = env === 'development'
//   ? '/src/data'
//   : env === 'production'
//     ? 'https://www.url.com'
//     : 'https://debug.url.com'

// util.ajax = axios.create({
//   baseURL: '/src/data',
//   timeout: 30000
// })

util.inOf = function (arr, targetArr) {
  let res = true
  arr.map(item => {
    if (targetArr.indexOf(item) < 0) {
      res = false
    }
  })
  return res
}

util.oneOf = function (ele, targetArr) {
  if (targetArr.indexOf(ele) >= 0) {
    return true
  } else {
    return false
  }
}

util.showThisRoute = function (itAccess, currentAccess) {
  if (typeof itAccess === 'object' && itAccess.isArray()) {
    return util.oneOf(currentAccess, itAccess)
  } else {
    return itAccess === currentAccess
  }
}

util.getRouterObjByName = function (routers, name) {
  let routerObj = {}
  routers.forEach(item => {
    if (item.name === 'otherRouter') {
      item.children.forEach((child, i) => {
        if (child.name === name) {
          routerObj = item.children[i]
        }
      })
    } else {
      if (item.children.length === 1) {
        if (item.children[0].name === name) {
          routerObj = item.children[0]
        }
      } else {
        item.children.forEach((child, i) => {
          if (child.name === name) {
            routerObj = item.children[i]
          }
        })
      }
    }
  })
  return routerObj
}

util.handleTitle = function (vm, item) {
  return item.title
}

util.setCurrentPath = function (vm, name) {
  let title = ''
  let isOtherRouter = false
  vm.$store.state.app.routers.forEach(item => {
    if (item.children.length === 1) {
      if (item.children[0].name === name) {
        title = util.handleTitle(vm, item)
        if (item.name === 'otherRouter') {
          isOtherRouter = true
        }
      }
    } else {
      item.children.forEach(child => {
        if (child.name === name) {
          title = util.handleTitle(vm, child)
          if (item.name === 'otherRouter') {
            isOtherRouter = true
          }
        }
      })
    }
  })
  let currentPathArr = []
  if (name === 'home') {
    currentPathArr = [
      {
        title: util.handleTitle(vm, util.getRouterObjByName(vm.$store.state.app.routers, 'home')),
        path: '',
        name: 'home'
      }
    ]
  } else if ((name.indexOf('_index') >= 0 || isOtherRouter) && name !== 'home') {
    currentPathArr = [
      {
        title: util.handleTitle(vm, util.getRouterObjByName(vm.$store.state.app.routers, 'home')),
        path: '/home',
        name: 'home'
      },
      {
        title: title,
        path: '',
        name: name
      }
    ]
  } else {
    let currentPathObj = vm.$store.state.app.routers.filter(item => {
      if (item.children.length <= 1) {
        return item.children[0].name === name
      } else {
        let i = 0
        let childArr = item.children
        let len = childArr.length
        while (i < len) {
          if (childArr[i].name === name) {
            return true
          }
          i++
        }
        return false
      }
    })[0]
    if (currentPathObj.children.length <= 1 && currentPathObj.name === 'home') {
      currentPathArr = [
        {
          title: '首页',
          path: '',
          name: 'home'
        }
      ]
    } else if (currentPathObj.children.length <= 1 && currentPathObj.name !== 'home') {
      currentPathArr = [
        {
          title: '首页',
          path: '/home',
          name: 'home'
        },
        {
          title: currentPathObj.title,
          path: '',
          name: name
        }
      ]
    } else {
      let childObj = currentPathObj.children.filter((child) => {
        return child.name === name
      })[0]
      currentPathArr = [
        {
          title: '首页',
          path: '/home',
          name: 'home'
        },
        {
          title: currentPathObj.title,
          path: '',
          name: currentPathObj.name
        },
        {
          title: childObj.title,
          path: currentPathObj.path + '/' + childObj.path,
          name: name
        }
      ]
    }
  }
  vm.$store.commit('setCurrentPath', currentPathArr)

  return currentPathArr
}

util.openNewPage = function (vm, name, argu, query) {
  if (vm.$store === undefined) {
    return
  }
  let pageOpenedList = vm.$store.state.app.pageOpenedList

  let openedPageLen = pageOpenedList.length
  let i = 0
  let tagHasOpened = false
  while (i < openedPageLen) {
    if (name === pageOpenedList[i].name) { // 页面已经打开
      vm.$store.commit('pageOpenedList', {
        index: i,
        argu: argu,
        query: query
      })
      tagHasOpened = true
      break
    }
    i++
  }

  if (!tagHasOpened) {
    let tag = vm.$store.state.app.tagsList.filter((item) => {
      if (item.children && item.children.length > 0) {
        return name === item.children[0].name
      } else {
        return name === item.name
      }
    })
    tag = tag[0]
    if (tag) {
      tag = tag.children && tag.children.length > 0 ? tag.children[0] : tag
      if (argu) {
        tag.argu = argu
      }
      if (query) {
        tag.query = query
      }
      console.log(tag)
      vm.$store.commit('increateTag', tag)
    }
  }
  vm.$store.commit('setCurrentPageName', name)
}

util.toDefaultPage = function (routers, name, route, next) {
  let len = routers.length
  let i = 0
  let notHandle = true
  while (i < len) {
    if (routers[i].name === name && routers[i].children && routers[i].redirect === undefined) {
      route.replace({
        name: routers[i].children[0].name
      })
      notHandle = false
      next()
      break
    }
    i++
  }
  if (notHandle) {
    next()
  }
}

util.fullscreenEvent = function (vm) {
  // 权限菜单过滤相关
  vm.$store.commit('updateMenulist')
}
util.initRouter = function (vm) {
  const constRoutes = []
  const otherRoutes = []

  // 404路由需要和动态路由一起注入
  const otherRouter = [{
    path: '/*',
    name: 'error-404',
    meta: {
      title: '404-页面不存在'
    },
    component: 'error-page/404'
  }]
  // 模拟异步请求
  getUserMenuAndPerm().then(res => {
    console.log('getUserMenuAndPerm==>', JSON.stringify(res))
    // })
    // util.ajax('menu.json').then(res => {
    var menuData = res.data
    util.initRouterNode(constRoutes, menuData)
    util.initRouterNode(otherRoutes, otherRouter)
    // 添加主界面路由
    vm.$store.commit('updateAppRouter', constRoutes.filter(item => item.children.length > 0))
    // 添加全局路由
    vm.$store.commit('updateDefaultRouter', otherRoutes)
    // 刷新界面菜单
    vm.$store.commit('updateMenulist', constRoutes.filter(item => item.children.length > 0))

    let tagsList = []

    vm.$store.state.app.routers.map((item) => {
      if (item.children.length <= 1) {
        tagsList.push(item.children[0])
      } else {
        tagsList.push(...item.children)
      }
    })
    vm.$store.commit('setTagsList', tagsList)
  })
}

// 生成路由节点
util.initRouterNode = function (routers, data) {
  for (var item of data) {
    let menu = Object.assign({}, item)
    // menu.component = import(`@/views/${menu.component}.vue`);
    menu.component = lazyLoading(menu.component)

    if (item.children && item.children.length > 0) {
      menu.children = []
      util.initRouterNode(menu.children, item.children)
    }
    let meta = {}
    // 给页面添加标题
    meta.permission = menu.permission ? menu.permission : null
    meta.title = menu.title ? menu.title : null

    menu.meta = meta

    routers.push(menu)
  }
}

export default util
