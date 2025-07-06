<template>
  <div @click="handleToJmx">
    <div class="toolbar">
      <div
        v-for="(group,index) in toolbarGroups"
        :key="index"
        style="display: flex"
      >
        <div
          v-for="item in group"
          :key="item.content"
          style="display: flex"
        >
          <el-tooltip effect="light" :content="item.content" placement="bottom-start" :open-delay="3000">
            <button class="toolbar-button">
              <img
                :src="item.image"
                :alt="item.content"
                :class="{'toolbar-button-icon':true, 'inactive': item.inactive}"
                @click="item.action"
              >
            </button>
          </el-tooltip>
        </div>
        <el-divider v-if="index + 1 < toolbarGroups.length" direction="vertical"/>
      </div>
      <input
        ref="fileInput"
        type="file"
        style="display: none"
        accept=".jmx"
        @change="handleChange"
      >
    </div>
    <div class="components-container">
      <split-pane split="vertical" :default-percent="30">
        <template slot="paneL">
          <div class="left-container">
            <div style="overflow: scroll;margin-bottom: 10px;height: 100%">
              <el-tree
                ref="testPlanTree"
                node-key="id"
                height="100%"
                highlight-current
                :draggable="true"
                :expand-on-click-node="false"
                :filter-node-method="filterTreeNode"
                :data="testPlanData"
                :props="testPlanTreeProps"
                style="margin-left: 10px"
                @node-click="handleTreeNodeClick"
                @node-contextmenu="handleTreeNodeRightClick"
                @node-expand="contextMenuVisible=false"
                @node-collapse="contextMenuVisible=false"
              >
                <span slot-scope="{ node, data }" style="height: 100%">
                  <span :style="{opacity: data.attributes.enabled === 'false'?0.5:1, fontsize: '12px'}">
                    <img
                      :src="getElementImage(data.attributes.testclass)"
                      alt="测试计划"
                      style="height: 80%;vertical-align:sub; margin-right: 5px"
                    >{{ node.label }}
                  </span>
                </span>
              </el-tree>
            </div>
          </div>
          <el-popover
            :value="contextMenuVisible"
            trigger="manual"
          >
            <el-cascader-panel
              ref="contextMenu"
              :options="contextMenuOptions"
              :props="{ expandTrigger: 'hover', value: 'label'}"
              style="border: 0"
              @change="handleContextMenuClick"
            >
              <template slot-scope="{ node, data }">
                <span>{{ data.label }}</span>
                <el-divider v-if="data.divide"/>
              </template>
            </el-cascader-panel>
          </el-popover>
        </template>
        <template slot="paneR">
          <div class="right-container">
            <div v-if="checkedData.attributes.testname!==undefined">
              <el-card :header="checkedData.attributes.testclass" shadow="never">
                <el-form ref="form" :model="checkedData" label-width="120px" label-position="left" size="small">
                  <el-form-item label="名称">
                    <el-input v-model="checkedData.attributes.testname"/>
                  </el-form-item>
                  <el-form-item label="注释">
                    <el-input v-model="checkedData['TestPlan.comments']"/>
                  </el-form-item>
                  <div v-if="checkedData.attributes.guiclass==='TestPlanGui'">
                    <div style="text-align: center; margin-bottom: 10px">用户定义的变量</div>
                    <el-card shadow="never">
                      <el-table
                        :data="checkedData['TestPlan.user_defined_variables']['Arguments.arguments']"
                        border
                        size="mini"
                        style="width: 100%"
                        class="arguments-table"
                        @selection-change="handleArgumentsSelectionChange"
                      >
                        <el-table-column
                          type="selection"
                          width="55"
                        />
                        <el-table-column
                          prop="name"
                          label="名称"
                        >
                          <template slot-scope="scope">
                            <el-input
                              v-model="scope.row['Argument.name']"
                              placeholder="请输入内容"
                              @change="val=>{scope.row.attributes.name=val}"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="value"
                          label="值"
                        >
                          <template slot-scope="scope">
                            <el-input
                              v-model="scope.row['Argument.value']"
                              placeholder="请输入内容"
                            />
                          </template>
                        </el-table-column>
                      </el-table>
                      <div style="margin-top: 20px; text-align: center">
                        <el-button
                          type="primary"
                          size="mini"
                          @click="handleArgumentsAdd"
                        >
                          添加
                        </el-button>
                        <el-button
                          :disabled="argumentsSelection.length===0"
                          type="primary"
                          size="mini"
                          @click="handleArgumentsDelete"
                        >
                          删除
                        </el-button>
                      </div>
                    </el-card>
                  </div>
                  <div v-if="checkedData.attributes.guiclass==='ThreadGroupGui'">
                    <label-border title="在取样器错误后要执行的动作" :bottom-padding="0">
                      <el-form-item label-width="0px">
                        <el-radio-group v-model="checkedData['ThreadGroup.on_sample_error']">
                          <el-radio
                            v-for="choice in [
                              {label:'继续', value:'continue'},
                              {label:'启动下一进程循环',value:'startnextloop'},
                              {label:'停止线程', value:'stopthread'},
                              {label:'停止测试', value: 'stoptest'},
                              {label: '立即停止测试',value: 'stoptestnow'}
                            ]"
                            :key="choice.value"
                            :label="choice.value"
                          >
                            {{ choice.label }}
                          </el-radio>
                        </el-radio-group>
                      </el-form-item>
                    </label-border>
                    <label-border title="线程属性">
                      <el-form-item label="线程数">
                        <el-input-number v-model="checkedData['ThreadGroup.num_threads']" controls-position="right"/>
                      </el-form-item>
                      <el-form-item label="Ramp-Up时间(秒)">
                        <el-input-number v-model="checkedData['ThreadGroup.ramp_time']" controls-position="right"/>
                      </el-form-item>
                      <div style="display:flex">
                        <el-form-item label="循环次数" label-width="58px">
                          <el-checkbox
                            v-model="checkedData['ThreadGroup.main_controller']['LoopController.continue_forever']"
                          >永远
                          </el-checkbox>
                        </el-form-item>
                        <el-form-item label-width="10px">
                          <el-input-number
                            v-model="checkedData['ThreadGroup.main_controller']['LoopController.loops']"
                            controls-position="right"
                          />
                        </el-form-item>
                      </div>
                      <el-form-item>
                        <el-checkbox
                          v-model="checkedData['ThreadGroup.same_user_on_next_iteration']"
                        >Same user on each iteration
                        </el-checkbox>
                      </el-form-item>
                      <el-form-item>
                        <el-checkbox
                          v-model="checkedData['ThreadGroup.delayedStart']"
                        >延迟创建现程直到需要
                        </el-checkbox>
                      </el-form-item>
                      <el-form-item>
                        <el-checkbox
                          v-model="checkedData['ThreadGroup.scheduler']"
                        >调度器
                        </el-checkbox>
                      </el-form-item>
                      <el-form-item label="持续时间(秒)">
                        <el-input-number
                          v-model="checkedData['ThreadGroup.ramp_time']"
                          :disabled="!checkedData['ThreadGroup.scheduler']"
                          controls-position="right"
                        />
                      </el-form-item>
                      <el-form-item label="启动延迟(秒)">
                        <el-input-number
                          v-model="checkedData['ThreadGroup.ramp_time']"
                          :disabled="!checkedData['ThreadGroup.scheduler']"
                          controls-position="right"
                        />
                      </el-form-item>
                    </label-border>
                  </div>
                  <div v-if="['HttpTestSampleGui','HttpDefaultsGui'].includes(checkedData.attributes.guiclass)">
                    <el-tabs type="border-card" style="border: 0">
                      <el-tab-pane label="基本">
                        <label-border title="Web服务器" :bottom-padding="0">
                          <el-row :gutter="20">
                            <el-col :span="4">
                              <el-form-item label="协议" label-width="40px">
                                <el-select v-model="checkedData['HTTPSampler.protocol']">
                                  <el-option
                                    v-for="item in ['http', 'https']"
                                    :key="item"
                                    :label="item"
                                    :value="item"
                                  />
                                </el-select>
                              </el-form-item>
                            </el-col>
                            <el-col :span="16">
                              <el-form-item label="服务器名称或ip">
                                <el-input v-model="checkedData['HTTPSampler.domain']"/>
                              </el-form-item>
                            </el-col>
                            <el-col :span="4">
                              <el-form-item label="端口号" label-width="50px">
                                <el-input v-model="checkedData['HTTPSampler.port']"/>
                              </el-form-item>
                            </el-col>
                          </el-row>
                        </label-border>
                        <label-border title="HTTP请求">
                          <el-row :gutter="20">
                            <el-col :span="4">
                              <el-form-item label-width="0px">
                                <el-select v-model="checkedData['HTTPSampler.method']">
                                  <el-option
                                    v-for="item in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']"
                                    :key="item"
                                    :label="item"
                                    :value="item"
                                  />
                                </el-select>
                              </el-form-item>
                            </el-col>
                            <el-col :span="16">
                              <el-form-item label="路径" label-width="40px">
                                <el-input v-model="checkedData['HTTPSampler.path']"/>
                              </el-form-item>
                            </el-col>
                            <el-col :span="4">
                              <el-form-item label="内容编码" label-width="60px">
                                <el-input v-model="checkedData['HTTPSampler.contentEncoding']"/>
                              </el-form-item>
                            </el-col>
                          </el-row>
                          <el-checkbox v-model="checkedData['HTTPSampler.auto_redirects']">自动重定向</el-checkbox>
                          <el-checkbox v-model="checkedData['HTTPSampler.follow_redirects']">跟随重定向</el-checkbox>
                          <el-checkbox v-model="checkedData['HTTPSampler.use_keepalive']">使用KeepAlive</el-checkbox>
                          <el-checkbox
                            v-model="checkedData['HTTPSampler.DO_MULTIPART_POST']"
                          >
                            对POST使用multipart/form-data
                          </el-checkbox>
                          <el-checkbox v-model="checkedData['HTTPSampler.BROWSER_COMPATIBLE_MULTIPART']">
                            与浏览器兼容的头
                          </el-checkbox>
                          <el-tabs
                            ref="argumentsTab"
                            :value="activeName"
                            type="border-card"
                            style="border: 0; margin-top: 20px"
                            @tab-click="handleTabClick"
                          >
                            <el-tab-pane
                              label="参数"
                              name="args"
                              :disabled="isArgTabDisabled"
                            >
                              <el-card shadow="never">
                                <el-table
                                  :data="checkedData['HTTPsampler.Arguments']['Arguments.arguments']"
                                  border
                                  size="mini"
                                  style="width: 100%"
                                  class="arguments-table"
                                  @selection-change="handleArgumentsSelectionChange"
                                >
                                  <el-table-column
                                    type="selection"
                                    width="55"
                                  />
                                  <el-table-column
                                    prop="name"
                                    label="名称"
                                  >
                                    <template slot-scope="scope">
                                      <el-input
                                        v-model="scope.row['Argument.name']"
                                        placeholder="请输入内容"
                                        @change="val=>{scope.row.attributes.name=val}"
                                      />
                                    </template>
                                  </el-table-column>
                                  <el-table-column
                                    prop="value"
                                    label="值"
                                  >
                                    <template slot-scope="scope">
                                      <el-input
                                        v-model="scope.row['Argument.value']"
                                        placeholder="请输入内容"
                                      />
                                    </template>
                                  </el-table-column>
                                  <el-table-column
                                    prop="always_encode"
                                    label="编码？"
                                    width="80"
                                  >
                                    <template slot-scope="scope">
                                      <el-checkbox v-model="scope.row['HTTPArgument.always_encode']"/>
                                    </template>
                                  </el-table-column>
                                  <el-table-column
                                    prop="content_type"
                                    label="内容类型"
                                  >
                                    <template slot-scope="scope">
                                      <el-input v-model="scope.row['HTTPArgument.content_type']"/>
                                    </template>
                                  </el-table-column>
                                  <el-table-column
                                    prop="use_equals"
                                    label="包含等于？"
                                    width="100"
                                  >
                                    <template slot-scope="scope">
                                      <el-checkbox v-model="scope.row['HTTPArgument.use_equals']"/>
                                    </template>
                                  </el-table-column>
                                </el-table>
                                <div style="margin: 20px; text-align: center">
                                  <el-button
                                    type="primary"
                                    size="mini"
                                    @click="handleArgumentsAdd"
                                  >
                                    添加
                                  </el-button>
                                  <el-button
                                    :disabled="argumentsSelection.length===0"
                                    type="primary"
                                    size="mini"
                                    @click="handleArgumentsDelete"
                                  >
                                    删除
                                  </el-button>
                                </div>
                              </el-card>
                            </el-tab-pane>
                            <el-tab-pane
                              label="消息体数据"
                              name="body"
                              :disabled="isBodyTabDisabled"
                            >
                              <div v-if="checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length===1">
                                <el-input
                                  v-model="checkedData['HTTPsampler.Arguments']['Arguments.arguments'][0]['Argument.value']"
                                  type="textarea"
                                  :autosize="{ minRows: 2, maxRows: 80}"
                                />
                              </div>
                            </el-tab-pane>
                            <el-tab-pane label="文件上传" name="file">
                              <el-card shadow="never">
                                <div v-if="checkedData['HTTPsampler.Files'] !== undefined">
                                  <el-table
                                    :data="checkedData['HTTPsampler.Files']['HTTPFileArgs.files']"
                                    border
                                    size="mini"
                                    style="width: 100%"
                                    class="arguments-table"
                                    @selection-change="handleArgumentsSelectionChange"
                                  >
                                    <el-table-column
                                      type="selection"
                                      width="55"
                                    />
                                    <el-table-column
                                      prop="path"
                                      label="文件名称"
                                    >
                                      <template slot-scope="scope">
                                        <el-input
                                          v-model="scope.row['File.path']"
                                          placeholder="请输入内容"
                                          @change="val=>{scope.row.attributes.name=val}"
                                        />
                                      </template>
                                    </el-table-column>
                                    <el-table-column
                                      prop="paramname"
                                      label="参数名称"
                                    >
                                      <template slot-scope="scope">
                                        <el-input
                                          v-model="scope.row['File.paramname']"
                                          placeholder="请输入内容"
                                        />
                                      </template>
                                    </el-table-column>
                                    <el-table-column
                                      prop="mimetype"
                                      label="内容类型"
                                    >
                                      <template slot-scope="scope">
                                        <el-input v-model="scope.row['File.mimetype']"/>
                                      </template>
                                    </el-table-column>
                                  </el-table>
                                </div>
                                <div style="margin: 20px; text-align: center">
                                  <el-button
                                    type="primary"
                                    size="mini"
                                    @click="handleArgumentsAdd"
                                  >
                                    添加
                                  </el-button>
                                  <el-button
                                    :disabled="argumentsSelection.length===0"
                                    type="primary"
                                    size="mini"
                                    @click="handleArgumentsDelete"
                                  >
                                    删除
                                  </el-button>
                                </div>
                              </el-card>
                            </el-tab-pane>
                          </el-tabs>
                        </label-border>
                      </el-tab-pane>
                      <el-tab-pane label="高级">配置管理</el-tab-pane>
                    </el-tabs>
                  </div>
                  <div v-if="checkedData.attributes.guiclass==='HeaderPanel'">
                    <label-border title="信息头存储在信息头管理器中">
                      <el-table
                        :data="checkedData['HeaderManager.headers']"
                        border
                        size="mini"
                        style="width: 100%"
                        class="arguments-table"
                        @selection-change="handleArgumentsSelectionChange"
                      >
                        <el-table-column
                          type="selection"
                          width="55"
                        />
                        <el-table-column
                          prop="name"
                          label="名称"
                        >
                          <template slot-scope="scope">
                            <el-input
                              v-model="scope.row['Header.name']"
                              placeholder="请输入内容"
                              @change="val=>{scope.row.attributes.name=val}"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="value"
                          label="值"
                        >
                          <template slot-scope="scope">
                            <el-input v-model="scope.row['Header.value']" placeholder="请输入内容"/>
                          </template>
                        </el-table-column>
                      </el-table>
                      <div style="margin: 20px; text-align: center">
                        <el-button
                          type="primary"
                          size="mini"
                          @click="handleArgumentsAdd"
                        >
                          添加
                        </el-button>
                        <el-button
                          :disabled="argumentsSelection.length===0"
                          type="primary"
                          size="mini"
                          @click="handleArgumentsDelete"
                        >
                          删除
                        </el-button>
                      </div>
                    </label-border>
                  </div>
                  <div v-if="checkedData.attributes.guiclass==='ArgumentsPanel'">
                    <div style="text-align: center; margin-bottom: 10px">用户定义的变量</div>
                    <el-card shadow="never">
                      <el-table
                        :data="checkedData['Arguments.arguments']"
                        border
                        size="mini"
                        style="width: 100%"
                        class="arguments-table"
                        @selection-change="handleArgumentsSelectionChange"
                      >
                        <el-table-column
                          type="selection"
                          width="55"
                        />
                        <el-table-column
                          prop="name"
                          label="名称"
                        >
                          <template slot-scope="scope">
                            <el-input
                              v-model="scope.row['Argument.name']"
                              placeholder="请输入内容"
                              @change="val=>{scope.row.attributes.name=val}"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="value"
                          label="值"
                        >
                          <template slot-scope="scope">
                            <el-input
                              v-model="scope.row['Argument.value']"
                              placeholder="请输入内容"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="value"
                          label="描述"
                        >
                          <template slot-scope="scope">
                            <el-input v-model="scope.row['Argument.desc']" placeholder="请输入内容"/>
                          </template>
                        </el-table-column>
                      </el-table>
                      <div style="margin-top: 20px; text-align: center">
                        <el-button
                          type="primary"
                          size="mini"
                          @click="handleArgumentsAdd"
                        >
                          添加
                        </el-button>
                        <el-button
                          :disabled="argumentsSelection.length===0"
                          type="primary"
                          size="mini"
                          @click="handleArgumentsDelete"
                        >
                          删除
                        </el-button>
                      </div>
                    </el-card>
                  </div>
                  <div v-if="checkedData.attributes.guiclass==='JSONPostProcessorGui'">
                    <label-border title="应用于" :bottom-padding="0">
                      <div style="display: flex">
                        <el-form-item label-width="0px">
                          <el-radio-group v-model="checkedData['Sample.scope']">
                            <el-radio
                              v-for="choice in [
                                {label:'Main samples and Sub-samples',value:'all'},
                                {label:'Main samples only',value: undefined},
                                {label:'Sub-samples only',value:'children' },
                                {label:'JMeter variables Name to use',value:'variable'}
                              ]"
                              :key="choice.value"
                              :label="choice.value"
                            >
                              {{ choice.label }}
                            </el-radio>
                          </el-radio-group>
                        </el-form-item>
                        <el-form-item label-width="10px" width="100%">
                          <el-input
                            v-model="checkedData['Scope.variable']"
                            :disabled="checkedData['Sample.scope'] !== 'variable'"
                          />
                        </el-form-item>
                      </div>
                    </label-border>
                    <el-form-item label="Name of created variables" label-width="280px">
                      <el-input v-model="checkedData['JSONPostProcessor.referenceNames']"/>
                    </el-form-item>
                    <el-form-item label="JSON Path expressions" label-width="280px">
                      <el-input v-model="checkedData['JSONPostProcessor.jsonPathExprs']"/>
                    </el-form-item>
                    <el-form-item label="Match No. (0 for Random)" label-width="280px">
                      <el-input v-model="checkedData['JSONPostProcessor.match_numbers']"/>
                    </el-form-item>
                    <el-form-item label="Compute concatenation var (Sumx _ALL)" label-width="280px">
                      <el-checkbox v-model="checkedData['JSONPostProcessor.compute_concat']"/>
                    </el-form-item>
                    <el-form-item label="Default Values" label-width="280px">
                      <el-input v-model="checkedData['JSONPostProcessor.defaultValues']"/>
                    </el-form-item>
                  </div>
                  <div v-if="['JSR223PostProcessor','JSR223Sampler', 'JSR223PreProcessor'].includes(checkedData.attributes.testclass)">
                    <el-form-item label="语言">
                      <el-select v-model="checkedData.scriptLanguage">
                        <el-option
                          v-for="item in ['beanshell', 'bsh', 'groovy', 'java', 'jexl', 'jexl2']"
                          :key="item"
                          :label="item"
                          :value="item"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="参数">
                      <el-input v-model="checkedData.parameters"/>
                    </el-form-item>
                    <el-form-item label="文件名">
                      <el-input v-model="checkedData.filename"/>
                    </el-form-item>
                    <el-form-item label="如果可用，缓存编译脚本" label-width="180px">
                      <el-checkbox v-model="checkedData.cacheKey" true-label="true" false-label="false"/>
                    </el-form-item>
                    <label-border
                      title="脚本"
                    >
                      <el-input
                        v-model="checkedData.script"
                        type="textarea"
                        :autosize="{ minRows: 16, maxRows: 80}"
                        style="margin-right: 20px"
                      />
                    </label-border>
                  </div>
                  <div v-if="checkedData.attributes.testclass==='DebugSampler'">
                    <el-form-item label="Jmeter属性">
                      <el-select v-model="checkedData.displayJMeterProperties">
                        <el-option
                          v-for="item in [true, false]"
                          :key="item"
                          :label="item"
                          :value="item"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="Jmeter变量">
                      <el-select v-model="checkedData.displayJMeterVariables">
                        <el-option
                          v-for="item in [true, false]"
                          :key="item"
                          :label="item"
                          :value="item"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="系统属性">
                      <el-select v-model="checkedData.displaySystemProperties">
                        <el-option
                          v-for="item in [true, false]"
                          :key="item"
                          :label="item"
                          :value="item"
                        />
                      </el-select>
                    </el-form-item>
                  </div>
                </el-form>
              </el-card>
            </div>
          </div>
        </template>
      </split-pane>
    </div>
  </div>
</template>

<script>
import SplitPane from 'vue-splitpane'
import labelBorder from './lable-border.vue'
import {Jmx2Json, Json2Jmx} from './jmx'

const AddContextMenuOptions = [
  {
    label: '线程（用户）',
    children: [
      {
        label: 'setUp线程组',
        match: ['TestPlan']
      },
      {
        label: 'tearDown线程组',
        match: ['TestPlan']
      },
      {
        label: '线程组',
        match: ['TestPlan']
      }
    ]
  },
  {
    label: '配置元件',
    children: [
      {
        label: 'CSV Data Set Config',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy']
      },
      {
        label: 'HTTP信息头管理器',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy']
      },
      {
        label: 'HTTP Cookie管理器',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy']
      },
      {
        label: 'HTTP缓存管理器',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy']
      },
      {
        label: 'HTTP请求默认值',
        match: ['TestPlan', 'ThreadGroup', 'HTTPSamplerProxy']
      }
    ]
  },
  {
    label: '监听器',
    children: [
      {
        label: '查看结果树',
        match: ['TestPlan']
      }
    ]
  },
  {
    label: '取样器',
    children: [
      {
        label: 'HTTP请求',
        match: ['ThreadGroup']
      },
      {
        label: 'Debug Sampler',
        match: ['ThreadGroup']
      },
      {
        label: 'HTTP请求',
        match: ['ThreadGroup']
      }
    ]
  }
]

export default {
  components: {
    SplitPane,
    labelBorder
  },
  data() {
    return {
      toolbarGroups: [
        [
          {
            content: '新建',
            image: require('@/assets/jmeter/toolbar/48x48/document-new-4.png'),
            action: this.handleOpen,
            inactive: false
          },
          {
            content: '打开',
            image: require('@/assets/jmeter/toolbar/48x48/document-open-2.png'),
            action: this.handleOpen,
            inactive: false
          },
          {
            content: '保存',
            image: require('@/assets/jmeter/toolbar/48x48/document-save-5.png'),
            action: this.handleOpen,
            active: true,
            inactive: false
          },
          {
            content: '另存为',
            image: require('@/assets/jmeter/toolbar/48x48/document-save-as-5.png'),
            action: this.handleOpen,
            active: true,
            inactive: false
          }
        ],
        [
          {
            content: '剪切',
            image: require('@/assets/jmeter/toolbar/48x48/edit-cut-4.png'),
            action: this.handleCut,
            inactive: false
          },
          {
            content: '复制',
            image: require('@/assets/jmeter/toolbar/48x48/edit-copy-4.png'),
            action: this.handleCopy,
            inactive: false
          },
          {
            content: '粘贴',
            image: require('@/assets/jmeter/toolbar/48x48/edit-paste-4.png'),
            action: this.handlePaste,
            inactive: false
          }
        ],
        [
          {
            content: '全部展开',
            image: require('@/assets/jmeter/toolbar/48x48/list-add-3.png'),
            action: this.handleExpandAll,
            inactive: false
          },
          {
            content: '全部折叠',
            image: require('@/assets/jmeter/toolbar/48x48/list-remove-3.png'),
            action: this.handleCollapseAll,
            inactive: false
          },
          {
            content: '切换',
            image: require('@/assets/jmeter/toolbar/48x48/color-picker-toggle.png'),
            action: this.handleSwitch,
            inactive: false
          }
        ],
        [
          {
            content: '启动',
            image: require('@/assets/jmeter/toolbar/48x48/arrow-right-3.png'),
            action: this.handleExpandAll,
            inactive: this.isRunning
          },
          {
            content: '不停顿启动',
            image: require('@/assets/jmeter/toolbar/48x48/arrow-right-3-notimer.png'),
            action: this.handleExpandAll,
            inactive: this.isRunning
          },
          {
            content: '停止',
            image: require('@/assets/jmeter/toolbar/48x48/road-sign-us-stop.png'),
            action: this.handleExpandAll,
            inactive: !this.isRunning
          },
          {
            content: '关闭',
            image: require('@/assets/jmeter/toolbar/48x48/process-stop-4.png'),
            action: this.handleExpandAll,
            inactive: !this.isRunning
          }
        ],
        [
          {
            content: '清除',
            image: require('@/assets/jmeter/toolbar/48x48/run-build-clean.png'),
            action: this.handleExpandAll,
            inactive: this.isRunning
          },
          {
            content: '清除全部',
            image: require('@/assets/jmeter/toolbar/48x48/run-build-prune.png'),
            action: this.handleExpandAll,
            inactive: this.isRunning
          }
        ],
        [
          {
            content: '查找',
            image: require('@/assets/jmeter/toolbar/48x48/run-build-clean.png'),
            action: this.handleExpandAll,
            inactive: this.isRunning
          },
          {
            content: '重置搜索',
            image: require('@/assets/jmeter/toolbar/48x48/edit-clear-3.png'),
            action: this.handleExpandAll,
            inactive: this.isRunning
          }
        ],
        [
          {
            content: '函数助手对话框',
            image: require('@/assets/jmeter/toolbar/48x48/documentation.png'),
            action: this.handleExpandAll,
            inactive: this.isRunning
          },
          {
            content: '帮助',
            image: require('@/assets/jmeter/toolbar/48x48/help-contents-5.png'),
            action: this.onClickHelp,
            inactive: this.isRunning
          }
        ]
      ],
      isRunning: false,
      testPlanData: [],
      testPlanTreeProps: {
        label: (data) => {
          return data['attributes']['testname']
        },
        children: 'hashTree'
      },
      checkedData: {
        attributes: {}
      },
      currentNode: null,
      clipboard: null,
      argumentsSelection: [],
      contextMenuVisible: false,
      contextMenuOptions: [],
    }
  },

  computed: {
    activeName() {
      return this.checkedData['HTTPSampler.postBodyRaw'] ? 'body' : 'args'
    },
    isArgTabDisabled() {
      return this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length === 1 &&
        !this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'][0]['Argument.name'] &&
        Boolean(this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'][0]['Argument.value'])
    },
    isBodyTabDisabled() {
      return this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length > 1 ||
        (
          this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length === 1 &&
          Boolean(this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'][0]['Argument.name'])
        )
    }
  },

  methods: {
    handleTabClick(tab) {
      switch (tab.name) {
        case 'body' :
          this.checkedData['HTTPSampler.postBodyRaw'] = true
          if (
            this.checkedData['HTTPSampler.postBodyRaw'] &&
            this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'].length === 0
          ) {
            this.handleArgumentsAdd()
          }
          break
        case 'args':
          this.checkedData['HTTPSampler.postBodyRaw'] = false
          break
        case 'file':
          if (!this.checkedData.hasOwnProperty('HTTPsampler.Files')) {
            this.$set(
              this.checkedData, 'HTTPsampler.Files', {
                'HTTPFileArgs.files': [],
                attributes: {
                  name: 'HTTPsampler.Files',
                  elementType: 'HTTPFileArgs'
                }
              }
            )
          }
      }
    },

    changeNodeExpand(node, expanded) {
      node.expanded = expanded
      for (const child of node.childNodes) {
        this.changeNodeExpand(child, expanded)
      }
    },

    handleExpandAll() {
      this.changeNodeExpand(this.$refs.testPlanTree.store.root, true)
    },

    handleCollapseAll() {
      this.changeNodeExpand(this.$refs.testPlanTree.store.root, false)
    },

    filterTreeNode(value, data) {
      if (!value) return true
      return data.attributes.testname.indexOf(value) !== -1
    },
    handleTreeNodeClick(data, node) {
      console.log(data)
      // 适配右击时选中node
      if (this.currentNode !== null) {
        this.currentNode.isCurrent = false
      }
      this.contextMenuVisible = false
      this.argumentsSelection = []
      this.checkedData = data
      this.currentNode = node
    },

    filterOptions(options) {
      const filteredOptions = []
      for (const option of options) {
        if (option.children !== undefined && option.children.length > 0) {
          option.children = this.filterOptions(option.children)
        }
        if ((option.match !== undefined && option.match.includes(this.checkedData.attributes.testclass)) ||
          (option.match === undefined && option.children.length > 0)) {
          filteredOptions.push(option)
        }
      }
      return filteredOptions
    },
    getElementImage(testClass) {
      switch (testClass) {
        case 'TestPlan':
          return require('@/assets/jmeter/tree/48x48/applications-science-3.png')
        case 'ThreadGroup':
        case 'SetupThreadGroup':
        case 'PostThreadGroup':
          return require('@/assets/jmeter/tree/48x48/system-run-5.png')
        case 'HTTPSamplerProxy':
        case 'JSR223Sampler':
        case 'JDBCSampler':
        case 'DebugSampler':
          return require('@/assets/jmeter/tree/48x48/color-picker-grey.png')
        case 'ResultCollector':
          return require('@/assets/jmeter/tree/48x48/office-chart-area.png')
        case 'ResponseAssertion':
        case 'JSR223Assertion':
          return require('@/assets/jmeter/tree/48x48/document-preview.png')
        case 'ConstantTimer':
          return require('@/assets/jmeter/tree/48x48/appointment-new-3.png')
        case 'HeaderManager':
        case 'Arguments':
        case 'JDBCDataSource':
        case 'ConfigTestElement':
          return require('@/assets/jmeter/tree/48x48/preferences-system-4.png')
        case 'JSR223PreProcessor':
          return require('@/assets/jmeter/tree/48x48/document-import-2_custom.png')
        case 'RegexExtractor':
        case 'JSR223PostProcessor':
          return require('@/assets/jmeter/tree/48x48/document-export-4_custom.png')
        case 'TransactionController':
          return require('@/assets/jmeter/tree/48x48/view-list-tree-4.png')
      }
    },

    handleTreeNodeRightClick(event, data, node) {
      event.preventDefault()
      if (this.currentNode !== null) {
        this.currentNode.isCurrent = false
      }
      node.isCurrent = true
      this.currentNode = node
      this.checkedData = data
      this.contextMenuOptions = []
      let AddOptions = JSON.parse(JSON.stringify(AddContextMenuOptions))
      AddOptions = this.filterOptions(AddOptions)
      if (AddOptions.length > 0) {
        this.contextMenuOptions.push({
          label: '添加',
          children: AddOptions,
          divide: true
        })
      }
      if (this.checkedData.attributes.guiclass === 'TestPlanGui') {
        this.contextMenuOptions.push({
          label: '粘贴',
          divide: true
        })
      } else {
        ['剪切', '复制', '粘贴', '复写'].forEach(item => this.contextMenuOptions.push({
          label: item,
        }))
        this.contextMenuOptions.push({
          label: '删除',
          divide: true
        })
      }
      this.contextMenuOptions.push(...[{
        label: '启用',
        disabled: this.checkedData.attributes.enabled !== 'false'
      }, {
        label: '禁用',
        disabled: this.checkedData.attributes.enabled === 'false'
      }, {
        label: '切换',
      }])
      this.contextMenuVisible = true
      const element = document.querySelector('.el-popover')
      element.style.position = 'fixed'
      element.style.left = `${event.clientX}px`
      element.style.top = `${event.clientY}px`
      document.addEventListener('click', (ev) => {
        if (ev.target !== element) {
          document.removeEventListener('click', undefined)
          this.contextMenuVisible = false
        }
      })
    },

    handleCut() {
      if (this.currentNode !== null) {
        const index = this.currentNode.parent.childNodes.findIndex(child => child.id === this.currentNode.id)
        this.clipboard = this.currentNode.parent.data.hashTree.splice(index, 1)[0]
        this.checkedData = this.testPlanData[0]
        this.currentNode = null
      }
    },

    handleCopy() {
      if (this.currentNode !== null) {
        this.clipboard = this.checkedData
      }
    },

    handlePaste() {
      if (this.clipboard !== null) {
        this.checkedData.hashTree.push(this.clipboard)
        this.currentNode.data.hashTree = JSON.parse(JSON.stringify(this.checkedData.hashTree))
      }
    },
    handleDelete() {
      if (this.currentNode !== null) {
        const index = this.currentNode.parent.childNodes.findIndex(child => child.isCurrent)
        this.currentNode.parent.data.hashTree.splice(index, 1)
        this.checkedData = this.testPlanData[0]
        this.currentNode = null
      }
    },
    handleDuplicate() {
      const index = this.currentNode.parent.childNodes.findIndex(child => child.id === this.currentNode.id)
      this.currentNode.parent.data.hashTree.splice(index, 0, this.checkedData)
      this.currentNode.parent.data.hashTree = JSON.parse(JSON.stringify(this.currentNode.parent.data.hashTree))
    },
    handleContextMenuClick(value) {
      if (value.length > 0) {
        this.$refs.contextMenu.clearCheckedNodes()
      }
      this.contextMenuVisible = false
      switch (value[0]) {
        case '剪切':
          this.handleCut()
          break
        case '复制':
          this.handleCopy()
          break
        case '粘贴':
          this.handlePaste()
          break
        case '复写':
          this.handleDuplicate()
          break
        case '删除':
          this.handleDelete()
          break
        case '启用':
        case '禁用':
        case '切换':
          this.handleSwitch()
          break
      }
    },

    handleArgumentsSelectionChange(val) {
      this.argumentsSelection = val
    },

    handleSwitch() {
      this.$set(this.checkedData.attributes, 'enabled', String(this.checkedData.attributes.enabled === 'false'))
    },

    handleArgumentsAdd() {
      switch (this.checkedData.attributes.guiclass) {
        case 'TestPlanGui':
          this.checkedData['TestPlan.user_defined_variables']['Arguments.arguments'].push({
            attributes: {name: '', elementType: 'Argument'},
            'Argument.name': '',
            'Argument.value': '',
            'Argument.metadata': '='
          })
          break
        case 'HeaderPanel':
          this.checkedData['HeaderManager.headers'].push({
            'Header.name': '',
            'Header.value': '',
            attributes: {elementType: 'Header', name: ''}
          })
          break
        case 'ArgumentsPanel':
          this.checkedData['Arguments.arguments'].push({
            attributes: {name: '', elementType: 'Argument'},
            'Argument.name': '',
            'Argument.value': '',
            'Argument.metadata': '='
          })
          break
        case 'HttpTestSampleGui':
        case 'HttpDefaultsGui':
          if (this.$refs.argumentsTab.currentName === 'args') {
            this.checkedData['HTTPsampler.Arguments']['Arguments.arguments'].push({
              'Argument.name': '',
              'Argument.value': '',
              'Argument.metadata': '=',
              'HTTPArgument.always_encode': false,
              'HTTPArgument.content_type': 'text/plain',
              'HTTPArgument.use_equals': true,
              attributes: {name: '', elementType: 'HTTPArgument'}
            })
          } else {
            this.checkedData['HTTPsampler.Files']['HTTPFileArgs.files'].push({
              attributes: {
                name: '',
                elementType: 'HTTPFileArg',
              },
              'File.mimetype': '',
              'File.path': ''
            })
          }
          break
      }
    },
    handleArgumentsDelete() {
      let nameKey = 'Argument.name'
      let src
      switch (this.checkedData.attributes.guiclass) {
        case 'TestPlanGui':
          src = this.checkedData['TestPlan.user_defined_variables']['Arguments.arguments']
          break
        case 'HeaderPanel':
          src = this.checkedData['HeaderManager.headers']
          nameKey = 'Header.name'
          break
        case 'ArgumentsPanel':
          src = this.checkedData['Arguments.arguments']
          break
        case 'HttpTestSampleGui':
        case 'HttpDefaultsGui':
          if (this.$refs.argumentsTab.currentName === 'args') {
            src = this.checkedData['HTTPsampler.Arguments']['Arguments.arguments']
          } else {
            src = this.checkedData['HTTPsampler.Files']['HTTPFileArgs.files']
            nameKey = 'File.path'
          }
          break
      }
      for (const arg of this.argumentsSelection) {
        const index = src.findIndex(item => item[nameKey] === arg[nameKey])
        if (index !== -1) {
          src.splice(index, 1)
        }
      }
    },

    onClickHelp() {
      window.open('https://jmeter.apache.org/usermanual/component_reference.html', '_blank')
    },
    handleOpen() {
      this.$refs.fileInput.click()
    },
    handleChange(event) {
      if (event.target.files.length < 1) {
        return false
      }
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = async () => {
        const xmlData = reader.result
        console.log('xmlData', xmlData)
        this.testPlanData = Jmx2Json(xmlData)
        console.log('treeData', this.testPlanData)
      }
      reader.readAsText(file)
    },
    handleToJmx() {
      if (this.testPlanData.length > 0) {
        const xml = Json2Jmx(this.testPlanData)
        console.log(xml)
      }
    }
  }
}
</script>

<style scoped>

.toolbar {
  height: 32px;
  display: flex;
  margin-bottom: 10px;

  .toolbar-button {
    height: 90%;
    width: 32px;
    display: flex;
    padding: 1px !important;
    align-items: center;
    justify-content: center;

    .toolbar-button-icon {
      height: 100%;
    }

    .inactive {
      filter: grayscale(100%);
    }
  }

  .el-divider--vertical {
    margin: 8px 8px;
  }
}

.components-container {
  position: relative;
  height: calc(100vh - 50px);

  .el-cascader-menu__wrap {
    height: auto !important;
  }

  .el-divider--horizontal {
    margin: 0 !important;
  }
}

.left-container {
  height: auto;
}

.left-container >>> .el-tree {
  margin-left: 0 !important;
}

.right-container {
  background-color: #efefef;
  height: auto;
  white-space: pre;
  overflow: auto;

  .el-input__inner {
    border: 0 !important;
    box-shadow: none !important;
    padding-left: 0;
    border-radius: 0;
  }
  .el-checkbox__inner {
    border-radius: 0;
  }
  .el-button--mini {
    border-radius: 0;
  }
  .el-card {
    background: #eeeeee;

    .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {
      background: #eeeeee;
    }

    .el-tabs__content {
      background: #eeeeee;
    }
  }
}

</style>
