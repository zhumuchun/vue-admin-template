<template>
  <div class="label-border" :style="{paddingBottom: bottomPadding+'px'}">
    <span :style="{width: labelWidth+'px'}">{{title}}</span>
    <slot></slot>
  </div>
</template>
<script>
export default {
  props:{
    title:{
      type:String,
      default:()=>{
        return ''
      }
    },
    bottomPadding:{
      type:Number,
      default:()=>{
        return 20
      }
    }
  },
  data(){
    return {
      labelWidth: '80'
    }
  },

  mounted() {
    this.labelWidth = this.title.length * 16 + 8
  },

}
</script>
<style scoped>
.label-border {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  margin-top: 16px;
  margin-bottom: 10px;
  > span {
    position: absolute;
    left: 10px;
    top: -10px;
    text-align: center;
    font-size: 16px;
    color: #606266;
    font-weight: 900;
    background: #fff;
  }
}
</style>
