










var CommentBox = React.createClass({
	loadCommentsFromServer: function() {
		  $.ajax({
	      url: this.props.url,
	      dataType: 'json',
	      cache: false,
	      success: function(data) {
	        this.setState({data: data});
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
	}, 
	handleCommentSubmit : function(comment){
		$.ajax({
			url : this.props.url,
			dataType : 'json',
			type : 'POST',
			data : comment,
			success : function(data){
				this.setState({data:data})
			}.bind(this),
			error : function(xhr,status,err){

			}.bind(this)
		})
	},	
	getInitialState : function(){
		return {data:[]}
	},
	componentDidMount: function() {
	    this.loadCommentsFromServer();
    	setInterval(this.loadCommentsFromServer, this.props.pollInterval);
	},
	render : function(){
		return(
			<div className="commentBox">
				<h1>Comments</h1>
				<CommentList data={this.state.data}/>
				<CommentForm onCommentSubmit = {this.handleCommentSubmit}/>
			</div>
		)
	}
})
var CommentList = React.createClass({
	render : function(){
		var commentNodes = this.props.data.map(function(comment){
			return (
				<Comment author={comment.author}>
					{comment.text}
				</Comment>
			)
		})
		return(
			<div className="commentList"> 
				{commentNodes}
			</div>
		)
	}
})
var CommentForm = React.createClass({
	handleSubmit : function(e){
		e.preventDefault()
		var author = this.refs.author.value.trim()
		var text = this.refs.text.value.trim()
		if (!text || !author) {
	      return;
	    }
	    this.props.onCommentSubmit({author:author,text:text});
	    this.refs.author.value = '';
	    this.refs.text.value = '';
	    return;
	},
	render : function(){
		return (
			<div className="commentForm" onSubmit = {this.handleSubmit}>
				<input type="text" placeholder="Your name" ref="author"/>
				<input type="text" placeholder="Say something..." ref="text"/>
				<input type="submit" value="post"/>
			</div>
		)
	}
})
var Comment = React.createClass({
	rawMarkup : function(){
		var rawMarkup = marked(this.props.children.toString(),{sanitize:true})
		return { __html:rawMarkup}
	},
	render : function(){
		return(
			<div className="comment">
				<h2 className="commentAuthor">
					{this.props.author}
				</h2>
				<span dangerouslySetInnerHTML={this.rawMarkup()}/>
			</div>
		)
	}
})
var ContentBox = React.createClass({
	render : function(){
		return(
			<p>{this.props.name}</p>
		)
	}
})
var Post = React.createClass({
	componentDidMount: function() {
	    this.loadPostFromServer();
	},
	loadPostFromServer: function() {
		  $.ajax({
	      url: this.props.url,
	      dataType: 'json',
	      cache: false,
	      success: function(data) {
	        this.setState({data: data});
	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
	}, 
	render : function(){
		return (
			<div>
				<ContentBox name="hahaha"></ContentBox>
				<CommentBox url="/api/comments" pollInterval={2000}></CommentBox>
			</div>
		)
	}
})
ReactDOM.render(
	<Post url=""/>,document.getElementById('com')
)