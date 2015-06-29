import React from 'react'

export default React.createClass({
  displayName: 'DraggableResizableBox',

  propTypes: {
    aspectRatio: React.PropTypes.number.isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    onChange: React.PropTypes.func,
    offset: React.PropTypes.array,
    minConstraints: React.PropTypes.array,
    children: React.PropTypes.node
  },

  getInitialState () {
    let [width, height] = this.preserveAspectRatio(this.props.width, this.props.height)
    let centerYOffset = (this.props.height - height) / 2
    let centerXOffset = (this.props.width - width) / 2
    return {
      top: centerYOffset,
      left: centerXOffset,
      bottom: centerYOffset,
      right: centerXOffset,
      width: width,
      height: height
    }
  },

  componentDidMount () {
    document.addEventListener('mousemove', this.mouseMove)
    document.addEventListener('mouseup', this.mouseUp)
  },

  mouseMove (evt) {
    if (this.state.resizing) {
      this.onResize(evt)
    } else if (this.state.moving) {
      this.move(evt)
    }
  },

  mouseUp (evt) {
    if (this.state.resizing) {
      this.stopResize(evt)
    } else if (this.state.moving) {
      this.stopMove(evt)
    }
  },

  startResize (corner, event) {
    event.stopPropagation()
    this.setState({
      resizing: true,
      corner
    })
  },

  stopResize () {
    this.setState({resizing: false})
  },

  // resize strategies
  nw (mousePos, boxPos) {
    let pos = Object.assign({}, this.state, {
      top: this.constrainBoundary(mousePos.clientY - boxPos.top),
      left: this.constrainBoundary(mousePos.clientX - boxPos.left)
    })
    let dimensions = this.calculateDimensions(pos)
    let [width, height] = this.preserveAspectRatio(dimensions.width, dimensions.height, [pos.bottom, pos.right])
    pos.top = this.props.height - pos.bottom - height
    pos.left = this.props.width - pos.right - width
    return pos
  },
  ne (mousePos, boxPos) {
    let pos = Object.assign({}, this.state, {
      top: this.constrainBoundary(mousePos.clientY - boxPos.top),
      right: this.constrainBoundary(boxPos.right - mousePos.clientX)
    })
    let dimensions = this.calculateDimensions(pos)
    let [width, height] = this.preserveAspectRatio(dimensions.width, dimensions.height, [pos.bottom, pos.left])
    pos.top = this.props.height - pos.bottom - height
    pos.right = this.props.width - pos.left - width
    return pos
  },
  se (mousePos, boxPos) {
    let pos = Object.assign({}, this.state, {
      bottom: this.constrainBoundary(boxPos.bottom - mousePos.clientY),
      right: this.constrainBoundary(boxPos.right - mousePos.clientX)
    })
    let dimensions = this.calculateDimensions(pos)
    let [width, height] = this.preserveAspectRatio(dimensions.width, dimensions.height, [pos.top, pos.left])
    pos.bottom = this.props.height - pos.top - height
    pos.right = this.props.width - pos.left - width
    return pos
  },
  sw (mousePos, boxPos) {
    let pos = Object.assign({}, this.state, {
      bottom: this.constrainBoundary(boxPos.bottom - mousePos.clientY),
      left: this.constrainBoundary(mousePos.clientX - boxPos.left)
    })
    let dimensions = this.calculateDimensions(pos)
    let [width, height] = this.preserveAspectRatio(dimensions.width, dimensions.height, [pos.top, pos.right])
    pos.bottom = this.props.height - pos.top - height
    pos.left = this.props.width - pos.right - width
    return pos
  },

  onResize (event) {
    let box = React.findDOMNode(this).parentElement.parentElement.getBoundingClientRect()

    let position = this[this.state.corner](event, box)

    let dimensions = this.calculateDimensions(position)
    var widthChanged = dimensions.width !== this.state.width, heightChanged = dimensions.height !== this.state.height
    if (!widthChanged && !heightChanged) return

    this.setState(Object.assign({}, {
      clientX: event.clientX,
      clientY: event.clientY
    }, position, dimensions), () => {
      this.props.onChange({
        top: position.top,
        left: position.left
      }, dimensions)
    })
  },

  startMove (evt) {
    this.setState({
      moving: true,
      clientX: evt.clientX,
      clientY: evt.clientY
    })
  },

  stopMove (evt) {
    this.setState({
      moving: false
    })
  },

  move (evt) {
    evt.preventDefault()
    let movedX = evt.clientX - this.state.clientX
    let movedY = evt.clientY - this.state.clientY

    let position = {
      top: this.constrainBoundary(this.state.top + movedY),
      left: this.constrainBoundary(this.state.left + movedX),
      bottom: this.constrainBoundary(this.state.bottom - movedY),
      right: this.constrainBoundary(this.state.right - movedX)
    }

    if (!position.top) {
      position.bottom = this.props.height - this.state.height
    }
    if (!position.bottom) {
      position.top = this.props.height - this.state.height
    }
    if (!position.left) {
      position.right = this.props.width - this.state.width
    }
    if (!position.right) {
      position.left = this.props.width - this.state.width
    }

    this.setState(Object.assign({}, {
      clientX: evt.clientX,
      clientY: evt.clientY
    }, position), () => {
      this.props.onChange({
        top: position.top,
        left: position.left
      }, this.calculateDimensions(position))
    })
  },

  calculateDimensions ({top, left, bottom, right}) {
    return {width: this.props.width - left - right, height: this.props.height - top - bottom}
  },

  // If you do this, be careful of constraints
  preserveAspectRatio (width, height) {
    width = Math.max(width, this.props.minConstraints[0])
    height = Math.max(height, this.props.minConstraints[1])
    const currentAspectRatio = width / height

    if (currentAspectRatio < this.props.aspectRatio) {
      return [width, width / this.props.aspectRatio]
    } else if (currentAspectRatio > this.props.aspectRatio) {
      return [height * this.props.aspectRatio, height]
    } else {
      return [width, height]
    }
  },

  constrainBoundary (side) {
    return side < 0 ? 0 : side
  },

  render () {
    let style = {
      position: 'absolute',
      top: this.state.top,
      left: this.state.left,
      right: this.state.right,
      bottom: this.state.bottom
    }
    let {width} = this.calculateDimensions(this.state)
    let topStyle = {
      height: this.state.top
    }
    let bottomStyle = {
      height: this.state.bottom
    }
    let leftStyle = {
      top: this.state.top,
      right: width + this.state.right,
      bottom: this.state.bottom
    }
    let rightStyle = {
      top: this.state.top,
      left: width + this.state.left,
      bottom: this.state.bottom
    }

    return (
      <div className='DraggableResizable'>
        <div className='DraggableResizable-top' style={topStyle}></div>
        <div className='DraggableResizable-left' style={leftStyle}></div>
        <div style={style} onMouseDown={this.startMove}>
          {this.props.children}
          <div className='resize-handle resize-handle-se'
            onMouseDown={this.startResize.bind(null, 'se')}>
          </div>
          <div className='resize-handle resize-handle-ne'
            onMouseDown={this.startResize.bind(null, 'ne')}>
          </div>
          <div className='resize-handle resize-handle-sw'
            onMouseDown={this.startResize.bind(null, 'sw')}>
          </div>
          <div className='resize-handle resize-handle-nw'
            onMouseDown={this.startResize.bind(null, 'nw')}>
          </div>
        </div>
        <div className='DraggableResizable-right' style={rightStyle}></div>
        <div className='DraggableResizable-bottom' style={bottomStyle}></div>
      </div>
    )
  }
})