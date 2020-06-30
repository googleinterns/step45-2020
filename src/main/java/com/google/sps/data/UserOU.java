package com.google.sps.data;
import com.google.auto.value.AutoValue;

/**
 The class represents an OU, with field name, path, parentPath, and depth. 
 depth is the layer from root OU + 1.
*/
@AutoValue
public abstract class UserOU {
    public static UserOU create(String name, String path, String parentPath, int depth) {
        return new AutoValue_UserOU(name, path, parentPath, depth);
    }

    public abstract String getName();
    public abstract String getPath();
    public abstract String getParentPath();
    public abstract int getDepth();
}


