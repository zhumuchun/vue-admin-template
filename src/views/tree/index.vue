<template>
  <div class="components-container">
    <split-pane split="vertical" :default-percent="30">
      <template slot="paneL">
        <div class="left-container">
          <el-input
            v-model="filterText"
            placeholder="keyword"
            class="filter-input"
          />
          <vue-easy-tree
            ref="veTree"
            node-key="id"
            height="calc(100vh - 110px)"
            highlight-current
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            :data="treeData"
            :props="props"
            style="margin-left: 10px"
            @node-click="handleNodeClick"
          />
        </div>
      </template>
      <template slot="paneR">
        <div class="right-container">{{ checkedData }}</div>
      </template>
    </split-pane>
  </div>
</template>

<script>
import VueEasyTree from '@wchbrad/vue-easy-tree'
import SplitPane from 'vue-splitpane'
export default {
  components: {
    VueEasyTree,
    SplitPane
  },
  data() {
    return {
      filterText: '',
      props: {
        label: 'name',
        children: 'children'
      },
      treeData: [],
      checkedData: {}
    }
  },

  watch: {
    filterText(val) {
      this.$refs.veTree.filter(val)
    }
  },

  created() {
    const data = []
    const root = 8
    const children = 5
    const base = 1000
    for (let i = 0; i < root; i++) {
      data.push({
        id: `${i}`,
        name: `test-${i}`,
        children: []
      })
      for (let j = 0; j < children; j++) {
        data[i].children.push({
          id: `${i}-${j}`,
          name: `test-${i}-${j}`,
          children: []
        })
        for (let k = 0; k < base; k++) {
          data[i].children[j].children.push({
            id: `${i}-${j}-${k}`,
            name: `test-${i}-${j}-${k}`
          })
        }
      }
    }
    this.treeData = data
  },

  methods: {
    filterNode(value, data) {
      if (!value) return true
      return data.name.indexOf(value) !== -1
    },
    handleNodeClick(data) {
      this.checkedData = JSON.stringify(data, null, 4)
    }
  }
}
</script>

<style  scoped>
 .components-container {
   position: relative;
   height: calc(100vh - 50px);
 }

 .filter-input {
   padding: 10px;
 }

 .filter-input>>>.el-input__inner {
   border-radius: 30px;
 }

 .left-container {
   height: 100%;
 }

 .right-container {
   background-color: #FCE38A;
   height: 100%;
   white-space: pre;
   overflow: auto;
 }
</style>
