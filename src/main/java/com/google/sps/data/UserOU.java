package com.google.sps.data;

/**
 The class represents an OU, with field name, path, parentPath, and depth. 
 depth is the layer from root OU + 1.
*/
public class UserOU{
    String name;
    String path;
    String parentPath;
    int depth;

    public UserOU(String name, String path, String parentPath, int depth){
        this.name = name;
        this.path = path;
        this.parentPath = parentPath;
        this.depth = depth;
    }

    public String getName(){
        return this.name;
    }

    public String getPath(){
        return this.path;
    }

    public String getParentPath(){
        return this.parentPath;
    }

    public int getDepth(){
        return depth;
    }
}

