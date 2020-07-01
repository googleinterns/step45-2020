package com.google.sps.data;

import java.util.ArrayList;
import java.util.List;
import org.json.simple.JSONObject;

/**
 The class represent a node OU in a tree. Each node OU contains an OU, a parent OU node, and a list of children. 
*/
public class UserOUNode {
    private UserOU current = null;
    private UserOUNode parent = null;
    private List<UserOUNode> children = new ArrayList<UserOUNode>();
    
    public UserOUNode(UserOU current){
        this.current = current;
    }

    public UserOUNode(UserOU current, UserOUNode parent){
        this.current = current;
        this.parent = parent;
    }

    public UserOU getCurrent(){
        return this.current;
    }

    public UserOUNode getParent(){
        return this.parent;
    }

    public List<UserOUNode> getChildren(){
        return this.children;
    }

    public void addChild(UserOU childOU){
        UserOUNode child = new UserOUNode(childOU, this);
        this.children.add(child);
    }

    // DFS the tree to find the Node with matched path, the search only needs to go depth into  
    // one branch since the parent path is always a substring of children path
    public static UserOUNode getNodeByPath(UserOUNode currentNode, String path){
        String currentPath = currentNode.getCurrent().getPath();
        if(path.equals(currentPath)){
            return currentNode;
        }
        else{
            for(UserOUNode each: currentNode.getChildren()){
                if(path.contains(each.getCurrent().getPath())){
                    return getNodeByPath(each, path);
                }
            }
        }
        return null;
    }

    // Convert the tree of nodes to JSON
    public static JSONObject toJSON(UserOUNode node, List<UserOUNode> NodeChildren){
        JSONObject json = new JSONObject();
        json.put("name", node.getCurrent().getName());
        json.put("path", node.getCurrent().getPath());
        json.put("value", 5); // default num of users in the OU
        json.put("users", new ArrayList<JSONObject>()); // default num of users in the OU
        if(NodeChildren.size() != 0){
            List children = new ArrayList<JSONObject>();
            for (UserOUNode each: NodeChildren){
                children.add(toJSON(each, each.getChildren()));
            }
            json.put("children", children);
        } 
        return json;
    }
}
